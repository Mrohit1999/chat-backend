import { Router } from "express";

import { messageController } from "../controllers/message.controller.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { validate } from "../middleware/validate.middleware.ts";

import { chatParamsSchema } from "../validations/chat.validation.ts";

import {
  sendMessageSchema,
  getMessagesQuerySchema,
  markMessageReadSchema,
  updateLastSeenSchema,
  messageParamsSchema,
} from "../validations/message.validation.ts";

import type { ChatParams } from "../types/chat.types.ts";
import type { MessageParams } from "../types/message.types.ts";

const router = Router();

router.post<ChatParams>(
  "/chat/:chatId/message/send",
  authMiddleware,
  validate(chatParamsSchema, "params"),
  validate(sendMessageSchema),
  messageController.sendMessage,
);

router.get<ChatParams>(
  "/chat/:chatId/messages",
  authMiddleware,
  validate(chatParamsSchema, "params"),
  validate(getMessagesQuerySchema, "query"),
  messageController.getMessages,
);

router.post<MessageParams>(
  "/chat/:chatId/message/:messageId/read",
  authMiddleware,
  validate(messageParamsSchema, "params"),
  validate(markMessageReadSchema),
  messageController.markMessageRead,
);

router.post<ChatParams>(
  "/chat/:chatId/lastseen",
  authMiddleware,
  validate(chatParamsSchema, "params"),
  validate(updateLastSeenSchema),
  messageController.updateLastSeen,
);

export default router;
