# 🚀 Distributed Rate Limiter (Redis + Node.js + Docker)

A production-style **Distributed Rate Limiter** system built using **Node.js (Express)** and **Redis**, designed to control API request traffic across **multiple backend servers**.

This project demonstrates how large-scale systems (like Google, AWS, Netflix) protect APIs from abuse using **rate limiting** techniques.

<img width="640" height="253" alt="image" src="https://github.com/user-attachments/assets/c8013143-58f7-49de-a530-434b55e798c5" />

---

## 📌 Why Rate Limiting?

Rate limiting is used to:
- Prevent brute force attacks (login abuse)
- Protect servers from DDoS / high traffic spikes
- Control API usage for free vs premium users
- Avoid server overload and improve stability

---

## 🧠 What is a Distributed Rate Limiter?

A normal rate limiter works fine on a single server, but fails when multiple servers exist.

Example:
- Request 1 goes to Server A
- Request 2 goes to Server B
- Request 3 goes to Server C

If each server stores its own counter, then the user can bypass limits.

✅ A **Distributed Rate Limiter** solves this problem by using a shared store (Redis), ensuring that all servers follow the same global rate limit.

---

## 🏗️ Architecture

The system contains:
- **Redis** as a centralized counter store
- Multiple backend servers (Server 1, Server 2, etc.)
- Rate limiting middleware on each server
- Docker Compose to run everything together

### 🔥 Flow of a Request

Client Request → Server → Rate Limiter Middleware → Redis Counter Check  
If allowed → API response  
If limit exceeded → `429 Too Many Requests`

---

## 📊 Project Features

✅ Express REST API  
✅ Redis-based request counter  
✅ Multiple backend server instances  
✅ Shared Redis state (distributed working)  
✅ Per-route limiting support  
✅ Auto reset counter using TTL (`EXPIRE`)  
✅ Dockerized setup using Dockerfile + Docker Compose  

---

## ⚙️ Tech Stack

| Component | Technology |
|----------|------------|                                                                                       
| Backend API | Node.js + Express |
| Cache / Shared Store | Redis |
| Containerization | Docker |
| Multi-service setup | Docker Compose |

---

