# 🤖 Real-Time AI Chat Application

A full-stack, real-time AI Chat application built with **Node.js, Express, Socket.io, Groq AI (Llama 3.3 70B), MongoDB Atlas**, and **React + Vite + TailwindCSS**.

---

## 💡 Project Idea & Overview

The goal of this project is to build an instant, interactive **Real-Time AI Chat Application**. Instead of traditional page reloads or standard HTTP delay, it leverages **WebSockets (Socket.io)** paired with **Groq AI** (ultra-fast inference) to deliver live, low-latency AI responses while persisting all conversation history in **MongoDB**.

---

## ✨ Features

- ⚡ **Real-time Bidirectional Communication:** Powered by **Socket.io** for live chat messaging without polling or page refreshes.
- 🤖 **Ultra-Fast AI Engine:** Integrated with **Groq AI (`llama-3.3-70b-versatile`)** for sub-second intelligent AI responses.
- 💾 **Database Persistence:** Every user query and AI answer is saved automatically to **MongoDB Atlas**.
- 📜 **Chat History Retrieval:** REST endpoints to fetch past conversations seamlessly.
- 🎨 **Modern Frontend:** Built with **React, Vite, and TailwindCSS** for a responsive dark-themed UI.
- 🔌 **REST API + WebSockets:** Supports both HTTP REST endpoints and Socket event listeners.

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Real-Time Engine:** Socket.io
- **AI Integration:** Groq SDK (`groq-sdk`), `@google/genai`
- **Database:** MongoDB Atlas via Mongoose
- **Utilities:** `dotenv`, `cors`, `morgan`

### **Frontend**
- **Framework:** React.js
- **Build Tool:** Vite
- **Styling:** TailwindCSS (`@tailwindcss/vite`)
- **Socket Client:** `socket.io-client`

---

## 📂 Project Structure

```text
chat-with-ai-project/
├── backend/
│   ├── server.js               # HTTP & Socket.io Server Entry Point
│   ├── .env                    # Environment Variables (Port, DB, API Keys)
│   ├── package.json            # Backend Dependencies & Scripts
│   └── src/
│       ├── app.js              # Express Application Middlewares & Routes
│       ├── config/
│       │   └── db.js           # MongoDB Database Connection
│       ├── controller/
│       │   └── chat.controller.js  # REST Controllers (Send Message & History)
│       ├── model/
│       │   └── chat.model.js   # Mongoose Chat Schema & Model
│       ├── routes/
│       │   └── chat.routes.js  # Express REST API Routes
│       └── services/
│           └── ai.service.js   # Groq AI Generation Engine
└── frontend/                   # React + Vite + TailwindCSS Frontend Application
```

---

## 🚀 Getting Started

### 1️⃣ **Prerequisites**
- Node.js (v18+)
- MongoDB Atlas Database URI
- Groq AI API Key ([console.groq.com](https://console.groq.com/))

---

### 2️⃣ **Backend Setup**

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create/Configure `.env` file in `backend/`:
   ```env
   PORT=3000
   MONGODB_URL=your_mongodb_connection_string
   GROQ_API_KEY=your_groq_api_key
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *Server will run at: `http://localhost:3000`*

---

### 3️⃣ **Frontend Setup**

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server:
   ```bash
   npm run dev
   ```
   *App will run at: `http://localhost:5173`*

---

## 📡 API & Socket Documentation

### 🔌 **REST API Endpoints**

| Method | Endpoint | Description | Request Body |
|---|---|---|---|
| `GET` | `/` | Health Check | N/A |
| `POST` | `/api/chat/send` | Send prompt to AI & save to DB | `{ "message": "What is Node.js?" }` |
| `GET` | `/api/chat/history` | Retrieve all chat history | N/A |

#### **Example `POST /api/chat/send` Response:**
```json
{
  "success": true,
  "data": {
    "_id": "66b4cd78a8f12b3c4d5e6f7a",
    "userMessage": "What is Node.js?",
    "aiResponse": "Node.js is an open-source, cross-platform JavaScript runtime environment...",
    "modelUsed": "llama-3.3-70b-versatile",
    "createdAt": "2026-08-08T20:16:00.000Z"
  }
}
```

---

### ⚡ **Socket.io Events**

- **Client $\rightarrow$ Server (`send-message`):**
  ```javascript
  socket.emit("send-message", { message: "Explain React Hooks" });
  ```

- **Server $\rightarrow$ Client (`ai-response`):**
  ```javascript
  socket.on("ai-response", (data) => {
      console.log("AI Answer:", data.text);
  });
  ```

---

## 📝 License

This project is open-source and available under the [MIT License](LICENSE).

