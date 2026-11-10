import { Prisma } from "../generated/prisma/client.ts";
import { prisma } from "../config/database.ts";

import type { CreateChatInput, ChatResponse } from "../types/chat.types.ts";
import { AppError } from "../middleware/error.middleware.ts";

const chatInclude = {
  members: true,
} as const;

const formatChat = (chat: {
  id: string;
  type: "DIRECT" | "GROUP";
  createdAt: Date;
  members: {
    userId: string;
    chatId: string;
    joinedAt: Date;
  }[];
}): ChatResponse => ({
  id: chat.id,
  type: chat.type,
  createdAt: chat.createdAt,
  members: chat.members,
});

export const chatService = {
  async createChat(input: CreateChatInput) {
    const { userAId, userBId } = input;

    if (userAId === userBId) {
      throw new AppError(400, "Cannot create a chat with yourself");
    }

    const users = await prisma.user.findMany({
      where: {
        id: {
          in: [userAId, userBId],
        },
      },
      select: { id: true },
    });

    if (users.length !== 2) {
      throw new AppError(404, "One or both users do not exist");
    }

    const directKey = [userAId, userBId].sort().join(":");

    const existingChat = await prisma.chat.findUnique({
      where: { directKey },
    });

    if (existingChat) {
      return {
        success: true,
        message: "Chat already exists",
        chatId: existingChat.id,
      };
    }

    try {
      const chat = await prisma.chat.create({
        data: {
          type: "DIRECT",
          directKey,
          members: {
            create: [{ userId: userAId }, { userId: userBId }],
          },
        },
      });

      return {
        success: true,
        message: "Chat created successfully",
        chatId: chat.id,
      };
    } catch (error) {
      // Concurrent requests may try to create the same chat.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const chat = await prisma.chat.findUnique({
          where: { directKey },
        });

        if (chat) {
          return {
            success: true,
            message: "Chat already exists",
            chatId: chat.id,
          };
        }
      }

      throw error;
    }
  },

  async getUserChats(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    const chats = await prisma.chat.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: chatInclude,
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      chats: chats.map(formatChat),
    };
  },
};
