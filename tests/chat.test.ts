import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";

import { chatController } from "../src/controllers/chat.controller.ts";
import { authMiddleware } from "../src/middleware/auth.middleware.ts";
import { errorMiddleware } from "../src/middleware/error.middleware.ts";
import { chatService } from "../src/services/chat.service.ts";
import { env } from "../src/config/env.ts";

vi.mock("../src/services/chat.service.ts", () => ({
  chatService: {
    createChat: vi.fn(),
    getUserChats: vi.fn(),
  },
}));

const userAId = "550e8400-e29b-41d4-a716-446655440000";
const userBId = "550e8400-e29b-41d4-a716-446655440001";
const chatId = "550e8400-e29b-41d4-a716-446655440002";

const createToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

const app = express();
app.use(express.json());

app.post("/chat/create", authMiddleware, chatController.createChat);
app.get("/user/:userId/chats", authMiddleware, chatController.getUserChats);

app.use(errorMiddleware);

describe("Chat APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /chat/create", () => {
    it("should create a chat successfully", async () => {
      vi.mocked(chatService.createChat).mockResolvedValue({
        success: true,
        message: "Chat created successfully",
        chatId,
      });

      const response = await request(app)
        .post("/chat/create")
        .set("Authorization", `Bearer ${createToken(userAId)}`)
        .send({ userAId, userBId });

      expect(response.status).toBe(200);
      expect(response.body.chatId).toBe(chatId);
      expect(chatService.createChat).toHaveBeenCalledWith({
        userAId,
        userBId,
      });
    });

    it("should return an existing chat", async () => {
      vi.mocked(chatService.createChat).mockResolvedValue({
        success: true,
        message: "Chat already exists",
        chatId,
      });

      const response = await request(app)
        .post("/chat/create")
        .set("Authorization", `Bearer ${createToken(userAId)}`)
        .send({ userAId, userBId });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Chat already exists");
    });

    it("should reject requests without JWT", async () => {
      const response = await request(app)
        .post("/chat/create")
        .send({ userAId, userBId });

      expect(response.status).toBe(401);
      expect(chatService.createChat).not.toHaveBeenCalled();
    });

    it("should reject users who are not participants", async () => {
      const otherUserId = "550e8400-e29b-41d4-a716-446655440099";

      const response = await request(app)
        .post("/chat/create")
        .set("Authorization", `Bearer ${createToken(otherUserId)}`)
        .send({ userAId, userBId });

      expect(response.status).toBe(403);
      expect(chatService.createChat).not.toHaveBeenCalled();
    });
  });

  describe("GET /user/:userId/chats", () => {
    it("should return chats belonging to the user", async () => {
      vi.mocked(chatService.getUserChats).mockResolvedValue({
        success: true,
        chats: [
          {
            id: chatId,
            type: "DIRECT",
            createdAt: new Date("2026-01-01"),
            members: [
              { chatId, userId: userAId, joinedAt: new Date("2026-01-01") },
              { chatId, userId: userBId, joinedAt: new Date("2026-01-01") },
            ],
          },
        ],
      });

      const response = await request(app)
        .get(`/user/${userAId}/chats`)
        .set("Authorization", `Bearer ${createToken(userAId)}`);

      expect(response.status).toBe(200);
      expect(response.body.chats).toHaveLength(1);
      expect(response.body.chats[0].id).toBe(chatId);
    });

    it("should reject access to another user's chats", async () => {
      const response = await request(app)
        .get(`/user/${userBId}/chats`)
        .set("Authorization", `Bearer ${createToken(userAId)}`);

      expect(response.status).toBe(403);
      expect(chatService.getUserChats).not.toHaveBeenCalled();
    });

    it("should reject requests without JWT", async () => {
      const response = await request(app).get(`/user/${userAId}/chats`);

      expect(response.status).toBe(401);
    });
  });
});
