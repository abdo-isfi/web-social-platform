# ⚙️ Social Media Backend

The powerful engine driving the platform, built with **Node.js**, **Express**, and **MongoDB**.

---

## 🚀 Overview

A robust RESTful API and WebSocket server handling authentication, social interactions, notifications, and real-time communication.

### ✨ Highlights
- **Real-Time Engine:** Built with Socket.IO for instant social feedback.
- **Security First:** Includes JWT auth, rate limiting, and sanitization middlewares.
- **Scalable Data:** MongoDB integration with Mongoose for efficient social graph management.
- **Media Handling:** Structured support for binary image storage and external media URLs.

---

## 📂 Structure

```text
src/
├── 📁 controllers   # Request handlers & logic
├── 📁 middleware    # Auth, validation, and security layers
├── 📁 models        # Mongoose schemas & data definitions
├── 📁 routes        # API endpoint definitions
└── 📁 services      # Reusable business logic (Email, S3, etc.)
```

---

## 🛠️ Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment:
   Create a `.env` file based on `.env.example`.
3. Start development server:
   ```bash
   npm run dev
   ```

---

## 🔒 Security Features
- **JWT Protection:** Secure access to private endpoints.
- **Input Validation:** Powered by Joi.
- **Middleware:** Helmet, CORS, and data sanitization enabled by default.
