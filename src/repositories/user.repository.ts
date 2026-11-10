import { prisma } from "../config/database.ts";

export interface CreateUserData {
  name: string;
  email: string;
  passwordHash: string;
}

export const userRepository = {
  async findById(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  },

  async findByIds(userIds: string[]) {
    return prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
    });
  },

  async create(data: CreateUserData) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
      },
    });
  },

  async exists(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    return user !== null;
  },
};
