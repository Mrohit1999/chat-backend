import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppError } from "../middleware/error.middleware.ts";
import { prisma } from "../config/database.ts";
import { env } from "../config/env.ts";

import type {
  RegisterUserInput,
  LoginUserInput,
  UserResponse,
} from "../types/auth.types.ts";

const toUserResponse = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}): UserResponse => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt,
});

const generateToken = (userId: string): string => {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: "7d" });
};

export const authService = {
  async register(input: RegisterUserInput) {
    const email = input.email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(404, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        name: input.name.trim(),
        email,
        passwordHash,
      },
    });

    return {
      success: true,
      message: "User registered successfully",
      token: generateToken(user.id),
      user: toUserResponse(user),
    };
  },

  async login(input: LoginUserInput) {
    const email = input.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new AppError(401, "Invalid email or password");
    }

    return {
      success: true,
      message: "Login successful",
      token: generateToken(user.id),
      user: toUserResponse(user),
    };
  },
};
