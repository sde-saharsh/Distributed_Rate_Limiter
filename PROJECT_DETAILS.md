# Distributed Rate Limiter Project

## Overview
This project implements a distributed rate limiter using the **Token Bucket Algorithm** and **Redis**. It is designed to control the rate of traffic sent to an API, preventing abuse and ensuring fair usage across users.

## How It Works

### The Token Bucket Algorithm
The Token Bucket algorithm is based on an analogy of a bucket where tokens (permissions to make a request) are added at a constant rate.

1.  **Bucket Capacity**: The maximum number of tokens the bucket can hold. This represents the "burst" capacity—how many requests a user can make instantly if they have been inactive.
2.  **Refill Rate**: The speed at which tokens are added back to the bucket (e.g., 10 tokens per minute).
3.  **Consumption**: Each request consumes 1 token. If the bucket has tokens, the request is allowed. If the bucket is empty, the request is denied (throttled).

### Implementation Details

#### Tech Stack
-   **Node.js & Express**: The web server handling API requests.
-   **Redis**: Key-value store used to maintain the state of each user's bucket (tokens count and last refill timestamp). Redis is crucial for a *distributed* system because multiple server instances can share the same rate limit state.

#### Redis Scripts
To ensure **atomicity** (making sure check-and-update operations happen as a single indivisible step), we use a **Lua script** running inside Redis.

The script performs the following logic:
1.  Retrieves the current token count and the last refill timestamp for the user (identified by IP).
2.  Calculates how many tokens should be added based on the time elapsed since the last request.
3.  Caps the tokens at the maximum capacity.
4.  Checks if there are enough tokens for the current request.
5.  If yes: decrements the token count, updates the timestamp, and returns the remaining tokens.
6.  If no: returns -1 to indicate the request should be blocked.

### Project Structure
-   `src/app.js`: Main application setup.
-   `src/server.js`: Server entry point.
-   `src/config/redis.js`: Redis connection configuration.
-   `src/middlewares/rateLimiter.js`: The core middleware implementing the Token Bucket logic.

## Usage
1.  **Start Redis**: Ensure a Redis instance is running locally or accessible via `REDIS_URL`.
2.  **Run Server**: `npm run dev` or `npm start`.
3.  **Test**: Send requests to `http://localhost:3000/`. The headers `X-RateLimit-Remaining` will show your current balance.

## Running with Docker
Ideally, this project is run using Docker Compose to orchestrate both the Node.js application and the Redis database.

1.  **Build and Run**:
    ```bash
    docker-compose up --build
    ```
    This command will:
    -   Start a Redis container.
    -   Build the Node.js application image.
    -   Start the Node.js container, linked to Redis.

2.  **Access the API**:
    The API will be available at `http://localhost:3000`.

3.  **Scale (Simulated Distribution)**:
    You can run multiple instances of the app to see the shared state in action:
    ```bash
    docker-compose up --scale app=3
    ```
    Requests to any instance (managed by Docker's internal load balancer or round-robin if configured) will respect the *same* rate limit because they share the single Redis instance.

