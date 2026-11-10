import type { Request, Response } from "express";

import { messageService } from "../services/message.service.ts";

import type {
  SendMessageInput,
  GetMessagesQuery,
  MarkMessageReadInput,
  UpdateLastSeenInput,
  MessageParams,
} from "../types/message.types.ts";

import type { ChatParams } from "../types/chat.types.ts";

export const messageController = {
  async sendMessage(
    req: Request<ChatParams, {}, SendMessageInput>,
    res: Response,
  ): Promise<void> {
    const { chatId } = req.params;
    const { senderId, text } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (req.user.userId !== senderId) {
      res.status(403).json({
        success: false,
        message: "You cannot send messages as another user",
      });
      return;
    }

    const result = await messageService.sendMessage(chatId, {
      senderId,
      text,
    });

    res.status(201).json(result);
  },

  async getMessages(
    req: Request<ChatParams, {}, {}, GetMessagesQuery>,
    res: Response,
  ): Promise<void> {
    const { chatId } = req.params;
    const { limit, cursor } = req.query;

    const parsedLimit = limit === undefined ? 50 : Number(limit);

    if (
      !Number.isInteger(parsedLimit) ||
      parsedLimit < 1 ||
      parsedLimit > 100
    ) {
      res.status(400).json({
        success: false,
        message: "Limit must be an integer between 1 and 100",
      });
      return;
    }

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await messageService.getMessages(
      chatId,
      parsedLimit,
      cursor,
      req.user.userId,
    );

    res.status(200).json(result);
  },

  async markMessageRead(
    req: Request<MessageParams, {}, MarkMessageReadInput>,
    res: Response,
  ): Promise<void> {
    const { chatId, messageId } = req.params;
    const { userId } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (req.user.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You cannot mark messages as another user",
      });
      return;
    }

    const result = await messageService.markMessageRead(chatId, messageId, {
      userId,
    });

    res.status(200).json(result);
  },

  async updateLastSeen(
    req: Request<ChatParams, {}, UpdateLastSeenInput>,
    res: Response,
  ): Promise<void> {
    const { chatId } = req.params;
    const { userId, messageId } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (req.user.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You cannot update another user's last seen",
      });
      return;
    }

    const result = await messageService.updateLastSeen(chatId, {
      userId,
      messageId,
    });

    res.status(200).json(result);
  },
};
