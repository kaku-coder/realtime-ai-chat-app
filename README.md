<div align="center">

<!-- MOGO 3D Avatar Logo -->
<img src="./frontend/public/MOGO.png" alt="MOGO AI Logo" width="130" style="border-radius: 50%;">

# 🤖 MOGO AI — Real-Time AI Chat Application

**A lightning-fast, full-stack AI chat assistant powered by Groq Llama 3.3, Tavily Live Web Search, Socket.IO, Express.js & MongoDB.**

[![Live Frontend](https://img.shields.io/badge/Live%20Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://realtime-ai-chat-app-one.vercel.app)
[![Live Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://realtime-ai-chat-app1.onrender.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![Groq](https://img.shields.io/badge/Groq-llama--3.3--70b-F55036?style=for-the-badge&logo=groq&logoColor=white)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

</div>

---

## 🌐 Live Application Links

- 🖥️ **Live Frontend Application (Vercel)**: [https://realtime-ai-chat-app-one.vercel.app](https://realtime-ai-chat-app-one.vercel.app)
- ⚙️ **Live Backend Service (Render)**: [https://realtime-ai-chat-app1.onrender.com](https://realtime-ai-chat-app1.onrender.com)
- 📦 **GitHub Repository**: [https://github.com/kaku-coder/realtime-ai-chat-app](https://github.com/kaku-coder/realtime-ai-chat-app)

---

## ✨ Introduction

**MOGO AI** is a modern, production-ready full-stack real-time AI chat application. It pairs the **ultra-fast Groq inference engine** (`llama-3.3-70b-versatile`) with **Tavily live web search** so MOGO answers prompts with up-to-date real-world web data. 

MOGO greets users warmly on the first message (*"Hi! My name is MOGO. How can I help you today?"*) and provides direct, intelligent responses on subsequent follow-ups. Every chat conversation is saved as a session document in **MongoDB Atlas** and accessible anytime via the interactive sidebar.

---

## 🚀 Key Features

### 🤖 MOGO AI Engine
- ⚡ **Groq Llama 3.3 70B** — Ultra-fast inference with low latency.
- 🌐 **Live Web Search** — Automated Tavily web search integration for real-time web context.
- 💬 **Smart Greeting Persona** — Greets only on the first turn of a chat session, then transitions to direct answer mode.
- 👨‍💻 **Developer Metadata Aware** — Knows developer details (**Prakash Das**) and credits creator when asked.

### 🔌 Real-Time & Persistent Backend
- ⚡ **WebSocket Streaming** via Socket.IO — Instant bidirectional messaging.
- 🗂️ **MongoDB Session Architecture** — All messages of a chat session are stored in a single MongoDB document object.
- 🔁 **Auto Conversation Titles** — Session titles dynamically adapt to the user's first prompt text.

### 🎨 Modern Frontend Experience
- 🤖 **Custom MOGO 3D Robot Avatar** — Unique 3D dark robot branding.
- 📱 **100% Mobile & Tablet Responsive** — Responsive drawer sidebar with hamburger toggle button (`Menu`).
- ⚡ **Optimized State Management** — Built with React 19 `useReducer`, `useMemo`, and `useCallback`.
- 💬 **Interactive UI** — Optimistic message rendering, bouncing typing indicators, and smooth auto-scroll.

---

## 🛠️ Tech Stack

### Backend
| Layer | Technology |
|---|---|
| Runtime | Node.js (ES Modules `"type": "module"`) |
| Framework | Express.js 5.x |
| Real-Time | Socket.IO 4.x |
| AI Inference | Groq SDK (`llama-3.3-70b-versatile`) |
| Web Search | Tavily API (`@tavily/core`) |
| Database | MongoDB Atlas via Mongoose 9.x |

### Frontend
| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build Tool | Vite 8.x |
| Styling | Tailwind CSS 4.x |
| HTTP Client | Axios |
| Icons | Lucide React |

---

## 📂 Project Structure

```text
chat-with-ai-project/
├── backend/
│   ├── server.js                    # Express + Socket.IO server entry point
│   ├── package.json
│   └── src/
│       ├── app.js                   # Express app setup & middlewares
│       ├── config/
│       │   └── db.js                # MongoDB connection setup
│       ├── controller/
│       │   └── chat.controller.js   # Send message & history controllers
│       ├── model/
│       │   └── chat.model.js        # MongoDB Session Schema
│       ├── routes/
│       │   └── chat.routes.js       # REST endpoints
│       ├── services/
│       │   └── ai.service.js        # Groq + Tavily + MOGO persona engine
│       └── tools/
│           └── ai.tools.js          # Tavily search integration
└── frontend/
    ├── index.html                   # Title & Favicon setup
    ├── vite.config.js
    ├── package.json
    ├── public/
    │   ├── MOGO.png                 # 3D MOGO Robot Avatar
    │   └── favicon.svg              # App Favicon
    └── src/
        ├── main.jsx
        ├── App.jsx                  # Main Chat UI with Reducer & Hooks
        └── index.css                # Global Tailwind CSS
```

---

## 📡 REST API & Socket Endpoints

### REST APIs
| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/` | Health check endpoint | — |
| `POST` | `/api/chat/send` | Send prompt to MOGO & receive response | `{ "message": "hello", "chatId": "optional" }` |
| `GET` | `/api/chat/history` | Fetch all saved chat sessions | — |

### ⚡ Socket.IO Events
| Direction | Event | Description |
|---|---|---|
| Client → Server | `send-message` | Emit user prompt |
| Server → Client | `receive-message` | Receive AI streamed response |

---

## 🛠️ Local Development Setup

### 1️⃣ Clone & Install
```bash
git clone https://github.com/kaku-coder/realtime-ai-chat-app.git
cd realtime-ai-chat-app
```

### 2️⃣ Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/`:
```env
PORT=3000
MONGODB_URL=your_mongodb_connection_string
GROQ_API_KEY=your_groq_api_key
TAVILY_API_KEY=your_tavily_api_key
```

Run backend server:
```bash
npm run dev
```

### 3️⃣ Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
Open **`http://localhost:5173`** in your browser!

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for more details.

---

<div align="center">

**Designed & Developed by [Prakash Das](https://github.com/kaku-coder)**  
*MERN Stack Developer & MCA Student at Raajadhani Engineering College, Bhubaneswar, Odisha*

[![GitHub](https://img.shields.io/badge/GitHub-kaku--coder-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/kaku-coder)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Prakash%20Das-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/prakash-das-8374b5296)
[![Email](https://img.shields.io/badge/Email-prakashdasdev1%40gmail.com-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:prakashdasdev1@gmail.com)

</div>
