import { prisma } from "../config/database.ts";

export const chatRepository = {
  async findById(chatId: string) {
    return prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        members: true,
      },
    });
  },

  async findByDirectKey(directKey: string) {
    return prisma.chat.findUnique({
      where: { directKey },
      include: {
        members: true,
      },
    });
  },

  async createDirectChat(userAId: string, userBId: string, directKey: string) {
    return prisma.chat.create({
      data: {
        type: "DIRECT",
        directKey,
        members: {
          create: [{ userId: userAId }, { userId: userBId }],
        },
      },
      include: {
        members: true,
      },
    });
  },

  async findUserChats(userId: string) {
    return prisma.chat.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        members: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  },

  async findMembership(chatId: string, userId: string) {
    return prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
    });
  },

  async isMember(chatId: string, userId: string): Promise<boolean> {
    const membership = await prisma.chatMember.findUnique({
      where: {
        chatId_userId: {
          chatId,
          userId,
        },
      },
      select: {
        userId: true,
      },
    });

    return membership !== null;
  },
};
