import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js";
import storyRouter from "./routes/story.routes.js"; // ✅ NEW LINE
import groupRouter from "./routes/group.routes.js";
import path from "path";
import { fileURLToPath } from 'url';
import { app, server } from "./socket/socket.js";

dotenv.config();

const port = process.env.PORT || 5000;

// ✅ To use __dirname with ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve uploaded media
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ✅ ROUTES
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/story", storyRouter); // ✅ STORY ROUTES
app.use("/api/group", groupRouter);

server.listen(port, () => {
  connectDb();
  console.log(`✅ Server started on http://localhost:${port}`);
});
