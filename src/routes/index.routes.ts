import { Router } from "express";

import authRoutes from "./auth.routes.ts";
import chatRoutes from "./chat.routes.ts";
import messageRoutes from "./message.routes.ts";

const router = Router();

// Authentication routes
router.use("/auth", authRoutes);

// Chat routes
router.use("/", chatRoutes);

// Message routes
router.use("/", messageRoutes);

export default router;
