const { redisClient } = require('../config/redis');

// Lua script to atomically update the token bucket
const tokenBucketScript = `
local tokens_key = KEYS[1]
local timestamp_key = KEYS[2]
local capacity = tonumber(ARGV[1])
local rate = tonumber(ARGV[2]) 
local now = tonumber(ARGV[3])
local requested = tonumber(ARGV[4])

local last_refill = tonumber(redis.call('get', timestamp_key) or now)
local tokens = tonumber(redis.call('get', tokens_key) or capacity)

local delta = math.max(0, now - last_refill)
local filled_tokens = math.min(capacity, tokens + (delta * rate))

if filled_tokens >= requested then
    local new_tokens = filled_tokens - requested
    redis.call('set', tokens_key, new_tokens)
    redis.call('set', timestamp_key, now)
    
    -- Set expiry to avoid stale keys (e.g., time to full refill + buffer)
    -- If rate is 0, expire quickly? No, rate shouldn't be 0
    local expiry = math.ceil(capacity / rate)
    redis.call('expire', tokens_key, expiry)
    redis.call('expire', timestamp_key, expiry)

    return new_tokens
else
    return -1
end
`;

/**
 * Rate Limiter Middleware using Token Bucket Algorithm
 * @param {Object} options
 * @param {number} options.capacity - Maximum number of tokens in the bucket (e.g., 10)
 * @param {number} options.refillRate - Tokens per second (e.g., 10/60 for 10 reqs per minute)
 * @param {number} options.windowSize - Time window in seconds (e.g., 60)
 */
const rateLimiter = ({ capacity, refillRate, windowSize }) => {
    
    // Calculate rate in tokens per second
    // If user provides refillRate directly, use it. Otherwise derive from capacity/windowSize?
    // Let's assume user passes capacity and windowSize (like "10 requests per 60 seconds")
    // Rate = capacity / windowSize
    
    const rate = refillRate ? refillRate : (capacity / windowSize);

    return async (req, res, next) => {
        try {
            if (!redisClient.isOpen) {
               console.warn("Redis client not open, bypassing rate limiter");
               return next();
            }

            const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
            const keyPrefix = `rate_limit:${ip}`;
            const tokensKey = `${keyPrefix}:tokens`;
            const timestampKey = `${keyPrefix}:ts`;
            
            const now = Date.now() / 1000; // current time in seconds
            const requested = 1; // cost of one request

            const result = await redisClient.eval(
                tokenBucketScript,
                {
                    keys: [tokensKey, timestampKey],
                    arguments: [
                        capacity.toString(),
                        rate.toString(),
                        now.toString(),
                        requested.toString()
                    ]
                }
            );

            if (result >= 0) {
                res.set('X-RateLimit-Remaining', result);
                res.set('X-RateLimit-Limit', capacity);
                next();
            } else {
                res.status(429).json({
                    error: 'Too Many Requests',
                    message: `Rate limit exceeded. Try again later.`
                });
            }
        } catch (err) {
            console.error('Rate Limiter Error:', err);
            next(); // Fail open or closed? Usually fail open to avoid blocking users on system error.
        }
    };
};

module.exports = rateLimiter;
