const express = require('express');
const { connectRedis } = require('./config/redis');
const rateLimiter = require('./middlewares/rateLimiter');

const app = express();

app.use(express.json());

// Connect to Redis
connectRedis();

// Apply Rate Limiter Middleware
// Allow 10 requests per minute
app.use(rateLimiter({ capacity: 10, refillRate: 10, windowSize: 60 })); 

app.get('/', (req, res) => {
  res.send('Welcome to the Distributed Rate Limiter API!');
});

app.get('/api/resource', (req, res) => {
    res.json({ message: "You have accessed the protected resource!" });
});

module.exports = app;
