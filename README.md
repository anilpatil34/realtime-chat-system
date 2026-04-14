# 💬 Real-Time Chat & Notification System

A production-ready, WhatsApp-like real-time chat application built with Django Channels, Next.js, and WebSockets.

![Python](https://img.shields.io/badge/Python-3.10-blue)
![Django](https://img.shields.io/badge/Django-4.2-green)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Redis](https://img.shields.io/badge/Redis-7-red)
![MySQL](https://img.shields.io/badge/MySQL-8-orange)

---

## ✨ Features

- **Real-Time Chat** — WebSocket-based instant messaging (Django Channels + Redis)
- **1-to-1 & Group Chats** — Private conversations and group rooms
- **Read Receipts** — ✓ sent, ✓✓ read (WhatsApp-style double ticks)
- **Typing Indicators** — Live "user is typing..." feedback
- **Online/Offline Presence** — Real-time user status tracking
- **Push Notifications** — WebSocket-powered notification bell with unread count
- **JWT Authentication** — Secure token-based auth with auto-refresh
- **Dark/Light Mode** — Beautiful themed UI with smooth toggle
- **Responsive Design** — Works on desktop and mobile
- **Modern UI** — Glassmorphism, Framer Motion animations, Inter font

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, Django 4.2, Django REST Framework, Django Channels |
| **Frontend** | Next.js 15 (App Router), React, TypeScript, Tailwind CSS |
| **Database** | MySQL 8 |
| **Real-Time** | Redis 7 (Channel Layer), WebSockets |
| **Auth** | JWT (SimpleJWT) with token rotation & blacklisting |
| **Deployment** | Backend → Render, Frontend → Vercel |

---

## 📁 Project Structure

```
realtime-chat-system/
├── backend/                  # Django Backend
│   ├── config/               # Settings, ASGI, URLs
│   ├── users/                # Auth, User model, Profile
│   ├── chat/                 # ChatRoom, Message, WebSocket Consumer
│   ├── notifications/        # Notification model & WebSocket
│   ├── middleware/            # JWT WebSocket auth
│   ├── management/commands/  # Seed data command
│   └── requirements.txt
├── frontend/                 # Next.js Frontend
│   └── src/
│       ├── app/              # Pages (login, register, chat)
│       ├── components/       # UI components
│       ├── hooks/            # WebSocket & auth hooks
│       ├── contexts/         # Auth context
│       ├── stores/           # Zustand chat store
│       ├── lib/              # API client, utilities
│       └── types/            # TypeScript definitions
├── .github/workflows/        # CI/CD pipelines
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL 8+
- Redis 7+
- Redis 7+

### Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Create .env file (copy from .env.example)
copy .env.example .env

# Create MySQL database
# In MySQL: CREATE DATABASE chatdb;

# Run migrations
python manage.py migrate

# Seed sample data
python manage.py seed_data

# Start the dev server (Daphne for WebSocket support)
daphne -b 0.0.0.0 -p 8000 config.asgi:application
```

### Frontend Setup

```bash
# Navigate to frontend (in a new terminal)
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 📋 Sample Accounts

After running `seed_data`:

| Email | Password | Role |
|-------|----------|------|
| alice@example.com | TestPass123! | User |
| bob@example.com | TestPass123! | User |
| charlie@example.com | TestPass123! | User |
| diana@example.com | TestPass123! | User |
| admin@example.com | AdminPass123! | Admin |

---

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register new user |
| POST | `/api/auth/login/` | Login (returns JWT) |
| POST | `/api/auth/logout/` | Logout (blacklist token) |
| POST | `/api/auth/token/refresh/` | Refresh access token |
| GET | `/api/auth/profile/` | Get current user profile |
| GET | `/api/auth/users/` | List all users |
| GET | `/api/auth/users/online/` | List online users |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chat/rooms/` | List user's chat rooms |
| POST | `/api/chat/rooms/direct/` | Create 1-to-1 chat |
| POST | `/api/chat/rooms/group/` | Create group chat |
| GET | `/api/chat/rooms/{id}/messages/` | Get room messages |
| POST | `/api/chat/rooms/{id}/read/` | Mark messages as read |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications/` | List notifications |
| GET | `/api/notifications/unread-count/` | Get unread count |
| POST | `/api/notifications/{id}/read/` | Mark as read |
| POST | `/api/notifications/read-all/` | Mark all as read |

### WebSocket
| URL | Description |
|-----|-------------|
| `ws://host/ws/chat/{room_id}/?token=JWT` | Chat room WebSocket |
| `ws://host/ws/notifications/?token=JWT` | Notifications WebSocket |

---

## 🚢 Deployment

### Backend → Render

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `daphne -b 0.0.0.0 -p $PORT config.asgi:application`
5. Add environment variables from `.env.example`
6. Add a MySQL database (or use external)
7. Add a Redis instance

### Frontend → Vercel

1. Import project on [Vercel](https://vercel.com)
2. Set root directory: `frontend`
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`
   - `NEXT_PUBLIC_WS_URL=wss://your-backend.onrender.com`
4. Deploy!

---

## 🛠️ Development

```bash
# Run backend tests
cd backend && python manage.py test

# Run frontend lint
cd frontend && npm run lint

# Run frontend build
cd frontend && npm run build
```

---

## 📄 License

MIT License — feel free to use this project for learning and portfolios.
