import { Router } from "express";

import { chatController } from "../controllers/chat.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";

import {
  createChatSchema,
  userParamsSchema,
} from "../validations/chat.validation.ts";

import type { UserParams } from "../types/chat.types.ts";

const router = Router();

router.post(
  "/chat/create",
  authMiddleware,
  validate(createChatSchema),
  chatController.createChat,
);

router.get<UserParams>(
  "/user/:userId/chats",
  authMiddleware,
  validate(userParamsSchema, "params"),
  chatController.getUserChats,
);

export default router;
