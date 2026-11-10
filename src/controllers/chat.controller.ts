import type { Request, Response } from "express";

import { chatService } from "../services/chat.service.ts";

import type { CreateChatInput, UserParams } from "../types/chat.types.ts";

export const chatController = {
  async createChat(
    req: Request<{}, {}, CreateChatInput>,
    res: Response,
  ): Promise<void> {
    const { userAId, userBId } = req.body;

    const authenticatedUserId = req.user?.userId;

    if (!authenticatedUserId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (authenticatedUserId !== userAId && authenticatedUserId !== userBId) {
      res.status(403).json({
        success: false,
        message: "You must be a participant in the chat",
      });
      return;
    }

    const result = await chatService.createChat({
      userAId,
      userBId,
    });

    res.status(200).json(result);
  },

  async getUserChats(req: Request<UserParams>, res: Response): Promise<void> {
    const { userId } = req.params;

    if (req.user?.userId !== userId) {
      res.status(403).json({
        success: false,
        message: "You cannot access another user's chats",
      });
      return;
    }

    const result = await chatService.getUserChats(userId);

    res.status(200).json(result);
  },
};
