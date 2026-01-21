# 🎨 Social Media Frontend

The user-facing side of the platform, built with **React** and **Tailwind CSS**. Designed for speed, responsiveness, and a premium feel.

---

## 🚀 Overview

This application provides a seamless social experience with real-time updates, smooth transitions, and a clean, modern interface.

### ✨ Highlights
- **Vite Powered:** Blazing fast development and build times.
- **Redux Toolkit:** Scalable state management for global data like user auth and feeds.
- **Tailwind CSS:** Fully responsive design with a custom purple-accented theme.
- **Interests-Based Discovery:** A dedicated "Recommended" section filtered by user interests.

---

## 📂 Structure

```text
src/
├── 📁 components    # Reusable UI elements (Buttons, Cards, Modals)
├── 📁 hooks         # Custom React hooks for business logic
├── 📁 lib           # Utilities, constants, and API configuration
├── 📁 pages         # Main view components (Feed, Profile, Search)
├── 📁 redux         # Global state management slices and store
└── 📁 services      # API integration & Socket.IO handlers
```

---

## 🛠️ Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```

---

## 🔧 Production Deployment

The frontend is configured to be served via **Nginx** in a containerized environment. See `Dockerfile` and `nginx.conf` for details.
