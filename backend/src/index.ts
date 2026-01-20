import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/task.routes";
import goalRoutes from "./routes/goal.routes";
import reflectionRoutes from "./routes/reflection.routes";
import recurringTaskRoutes from "./routes/recurring-task.routes";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://beproductive.vercel.app",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/auth", authRoutes);
app.use("/tasks", taskRoutes);
app.use("/goals", goalRoutes);
app.use("/reflections", reflectionRoutes);
app.use("/recurring-tasks", recurringTaskRoutes);

app.get("/health", (req, res) => {
  res.send("OK");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
