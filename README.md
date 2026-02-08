c# Realtime-chat-app

A realtime chat application (React + Node.js) with Socket.IO, Clerk auth, and MongoDB.

Features
- Real-time messaging with Socket.IO
- User auth via Clerk
- Persistent messages in MongoDB (Mongoose)
- File upload support for avatars/media

Tech stack
- Backend: Node.js, Express, Socket.IO, Mongoose
- Frontend: React + Vite, Socket.IO client
- Auth: Clerk

Getting started

Prerequisites
- Node.js (16+ recommended)
- npm or yarn
- MongoDB instance or MongoDB Atlas URI
- Clerk account (for auth) — secret key

Quick start
1. Clone the repo

	git clone <repo-url>
	cd Realtime-chat-app

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