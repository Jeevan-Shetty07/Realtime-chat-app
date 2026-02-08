c# 💎 ChatIo

A premium, high-fidelity realtime chat application built with **React**, **Node.js**, **Socket.IO**, and **MongoDB**. Features a stunning **Glassmorphism** design with vibrant mesh backgrounds and silky-smooth interactions.

---

## ✨ Features

- **🚀 Real-time Messaging**: Instant message delivery using Socket.IO.
- **🛡️ Advanced Security**: Built on **Clerk** authentication with hierarchical admin roles.
- **🎨 Stunning UI**: Modern Glassmorphic design with animated mesh backgrounds.
- **👥 Group Chats**: Create, manage, and chat in groups with ease.
- **🖼️ Media Sharing**: Support for image and file attachments in messages.
- **🔔 Unread Counts**: Smart notification badges for missed messages.
- **🌒 Dynamic Themes**: Seamless switching between premium Dark and high-contrast Light modes.
- **👤 User Profiles**: Customizable avatars and bios.

---

## 🛠️ Tech Stack

### Frontend
- **React 19** + **Vite** (Ultra fast HMR)
- **Socket.IO Client** for real-time events
- **Clerk React** for user authentication
- **Vanilla CSS** (Custom Design System)

### Backend
- **Node.js** + **Express**
- **Socket.IO Server** (Scalable real-time engine)
- **MongoDB** + **Mongoose** (Reliable data storage)
- **Multer** for file handling

---

## 🚀 Quick Start

### 1. Repository Setup
```bash
git clone <your-repo-url>
cd ChatIo
```
2. Backend

	cd backend
	npm install

	Create a `.env` file in `backend/` with the following variables:

	MONGO_URI=your_mongo_connection_string
	JWT_SECRET=your_jwt_secret
	CLERK_SECRET_KEY=your_clerk_secret_key
	PORT=5000

	Run (development):

	npm run dev

	Or start production server:

	npm start

3. Frontend

	cd frontend
	npm install
	Run development server:

	npm run dev

	Build for production:

	npm run build

Project structure (top-level)
- `backend/` — Express API, Socket.IO server, Mongoose models
- `frontend/` — React + Vite client

Useful scripts
- Backend: `npm run dev` (nodemon), `npm start` (node)
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

Environment variables (backend)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — JWT signing secret for token generation
- `CLERK_SECRET_KEY` — Clerk secret key used by server-side Clerk client
- `PORT` — Optional port (defaults to 5000)

Contributing
- Open issues or PRs for fixes and improvements.

License
- MIT (or choose appropriate license)

Contact
- For questions, open an issue in this repository.