# 🚀 Deployment Guide: ChatIo

This guide will walk you through hosting your application on **Render** (the easiest platform for Node.js + React apps).

---

## 1. Prepare Your Database (MongoDB Atlas)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free cluster.
3. In **Network Access**, add `0.0.0.0/0` (Allow access from anywhere).
4. In **Database Access**, create a user and password.
5. Click **Connect** -> **Drivers** and copy your `SRV` connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/chat-app?retryWrites=true&w=majority`

---

## 2. Deploy the Backend (Web Service)
1. Push your code to a **GitHub repository**.
2. Log in to [Render.com](https://render.com/).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. **Configuration Settings**:
   - **Name**: `chat-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install` (inside the backend folder)
   - **Start Command**: `npm start`
6. **Environment Variables** (Click "Advanced"):
   - `MONGO_URI`: (Your MongoDB string from step 1)
   - `PORT`: `5000`
   - `ALLOWED_ORIGINS`: (Leave empty for now, we'll add the frontend URL later)
   - `CLERK_PUBLISHABLE_KEY`: (From your Clerk Dashboard)
   - `CLERK_SECRET_KEY`: (From your Clerk Dashboard)

---

## 3. Deploy the Frontend (Static Site)
1. Click **New +** -> **Static Site**.
2. Connect the same GitHub repository.
3. **Configuration Settings**:
   - **Name**: `chat-frontend`
   - **Build Command**: `npm run build` (inside the frontend folder)
   - **Publish Directory**: `dist` (or `build` if using CRA)
4. **Environment Variables**:
   - `VITE_API_BASE_URL`: (Paste your Render Backend URL here, e.g., `https://chat-backend.onrender.com`)
   - `VITE_API_URL`: (Same as above, or your production domain)
   - `VITE_CLERK_PUBLISHABLE_KEY`: (Your Clerk Publishable Key)

---

## 4. Final Link
1. Once the **Frontend** is deployed, copy its URL (e.g., `https://chat-frontend.onrender.com`).
2. Go back to your **Backend Service** -> **Environment Variables**.
3. Update `ALLOWED_ORIGINS` with your frontend URL.
4. **Save Changes**. Render will automatically redeploy the backend.

---

## ✅ Success!
Your app should now be live and accessible at your frontend URL.

> [!IMPORTANT]
> Since we use local storage for files (`/public/uploads`), files uploaded on Render will be **deleted** every time the server restarts.
> **Recommendation**: For production, move to **Cloudinary** or **AWS S3** for persistent file storage.
