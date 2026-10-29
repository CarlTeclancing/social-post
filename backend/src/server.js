import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import socialRoutes from "./routes/social.js";
import mediaRoutes from "./routes/media.js";
import postRoutes from "./routes/posts.js";
import { startScheduler } from "./workers/scheduler.js";
const app = express();
const configuredFrontendOrigin =
  process.env.FRONTEND_URL || "http://localhost:5173";
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || origin === configuredFrontendOrigin) {
        callback(null, true);
        return;
      }

      try {
        const { hostname, protocol } = new URL(origin);
        const isLocalOrigin =
          protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
        callback(null, isLocalOrigin);
      } catch {
        callback(null, false);
      }
    },
  }),
);
app.use(express.json({ limit: "10mb" }));
app.get("/health", (req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/posts", postRoutes);
app.use((e, req, res, next) => {
  console.error(e);
  res.status(500).json({ error: e.message || "Server error" });
});
app.listen(process.env.PORT || 4000, () => console.log("API running"));
startScheduler();
