# Interview Questions & Answers: Distributed Rate Limiter

## 1. Why use Redis for rate limiting?
**Answer:**
Redis is ideal for rate limiting because:
-   **Performance**: It is an in-memory store, providing extremely fast reads and writes (sub-millisecond latency), which is critical for middleware that runs on every request.
-   **Atomicity**: Redis supports Lua scripts, allowing us to perform "check-and-set" operations atomically. This prevents race conditions where two requests might simultaneously read the same token count and deduct from it incorrectly.
-   **TTL (Time To Live)**: Redis keys can expire automatically, making it easy to clean up state for inactive users without a background cleanup job.

## 2. Explain the Token Bucket algorithm vs. Leaky Bucket.
**Answer:**
-   **Token Bucket**: Tokens are added at a constant rate up to a max capacity. Requests consume tokens.
    -   *Pros*: Allows for "bursts" of traffic (up to capacity) while maintaining a long-term average rate.
-   **Leaky Bucket**: Requests enter a queue (bucket) and are processed at a constant rate. Ideally, the queue has a fixed size.
    -   *Pros*: Smooths out traffic to a perfectly constant flow.
    -   *Cons*: Does not allow bursts; strictly enforces the output rate.

## 3. How do you handle race conditions in a distributed environment?
**Answer:**
In a distributed system with multiple server instances, race conditions occur if multiple servers try to read and update the same user's rate limit counter at the same time.
We solve this by using **Redis Lua scripts**. The script executes as a single transaction in Redis. No other command can run while the script is executing, ensuring that the calculation of new tokens and the deduction happened in perfect isolation.

## 4. What happens if Redis goes down?
**Answer:**
This depends on the "fail-open" vs. "fail-closed" strategy.
-   **Fail-Open**: Allow the request to proceed even if the rate limiter fails. This prioritizes user experience but risks overloading the system.
-   **Fail-Closed**: Block the request. This protects the system but disrupts service for users.
*In this project, we typically implement a fail-open strategy (catch error and call `next()`) to ensure availability.*

## 5. How does this scale?
**Answer:**
This architecture scales horizontally. Because the state is stored in a centralized Redis (or a Redis Cluster), you can add as many API server instances as needed. They will all consult the same Redis store to enforce limits globally.
However, Redis can become a bottleneck if the load is massive. To mitigate this, one could use:
-   **Redis Cluster** / **Sharding**: Distribute keys across multiple Redis nodes.
-   **Local Caching**: Use a small local token bucket in memory for very high frequency checks to reduce Redis round-trips, syncing with Redis periodically (though this reduces strict accuracy).

## 6. What is the "Sliding Window Log" algorithm and why didn't we use it?
**Answer:**
-   **Sliding Window Log**: Keeps a log of timestamps for every request. To check a limit, we count how many logs exist in the window.
-   *Why not?*: It consumes much more memory (storing a timestamp for *every* request) and checks are more expensive (O(N) operations on the list) compared to the O(1) counter approach of Token Bucket.

## 7. How would you identify users?
**Answer:**
Currently, we use IP addresses (`req.ip`). However, in production, IP addresses can be shared (NAT) or spoofed. Better approaches include:
-   API Keys (for developers/clients).
-   User IDs (for authenticated users).
-   Session Tokens.
Using API Keys is standard for public APIs as it allows specific revocation and varied limits per plan (e.g., Free vs. Pro tier).
