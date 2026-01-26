import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { setupSocket } from "./sockets/socket.js";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);
  setupSocket(server);

  server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer();
