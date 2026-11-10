import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import jwt from "jsonwebtoken";
import { Timestamp } from "firebase-admin/firestore";

import { messageController } from "../src/controllers/message.controller.ts";
import { authMiddleware } from "../src/middleware/auth.middleware.ts";
import { errorMiddleware } from "../src/middleware/error.middleware.ts";
import { messageService } from "../src/services/message.service.ts";
import { env } from "../src/config/env.ts";

vi.mock("../src/services/message.service.ts", () => ({
  messageService: {
    sendMessage: vi.fn(),
    getMessages: vi.fn(),
    markMessageRead: vi.fn(),
    updateLastSeen: vi.fn(),
  },
}));

const userId = "550e8400-e29b-41d4-a716-446655440000";
const chatId = "550e8400-e29b-41d4-a716-446655440002";
const messageId = "firestore-message-001";

const createToken = (userId: string) =>
  jwt.sign({ userId }, env.JWT_SECRET, {
    expiresIn: "1h",
  });

const app = express();
app.use(express.json());

app.post(
  "/chat/:chatId/message/send",
  authMiddleware,
  messageController.sendMessage,
);

app.get(
  "/chat/:chatId/messages",
  authMiddleware,
  messageController.getMessages,
);

app.post(
  "/chat/:chatId/message/:messageId/read",
  authMiddleware,
  messageController.markMessageRead,
);

app.post(
  "/chat/:chatId/lastseen",
  authMiddleware,
  messageController.updateLastSeen,
);

app.use(errorMiddleware);

describe("Message APIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /chat/:chatId/message/send", () => {
    it("should send a message successfully", async () => {
      vi.mocked(messageService.sendMessage).mockResolvedValue({
        success: true,
        message: {
          id: messageId,
          chatId,
          senderId: userId,
          text: "Hello!",
          createdAt: Timestamp.now(),
        },
      });

      const response = await request(app)
        .post(`/chat/${chatId}/message/send`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({ senderId: userId, text: "Hello!" });

      expect(response.status).toBe(201);
      expect(response.body.message.text).toBe("Hello!");
      expect(messageService.sendMessage).toHaveBeenCalledWith(chatId, {
        senderId: userId,
        text: "Hello!",
      });
    });

    it("should reject impersonating another sender", async () => {
      const response = await request(app)
        .post(`/chat/${chatId}/message/send`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({
          senderId: "550e8400-e29b-41d4-a716-446655440099",
          text: "Hello!",
        });

      expect(response.status).toBe(403);
      expect(messageService.sendMessage).not.toHaveBeenCalled();
    });

    it("should reject requests without JWT", async () => {
      const response = await request(app)
        .post(`/chat/${chatId}/message/send`)
        .send({ senderId: userId, text: "Hello!" });

      expect(response.status).toBe(401);
    });
  });

  describe("GET /chat/:chatId/messages", () => {
    it("should return messages", async () => {
      vi.mocked(messageService.getMessages).mockResolvedValue({
        success: true,
        messages: [
          {
            id: messageId,
            chatId,
            senderId: userId,
            text: "Hello!",
            createdAt: Timestamp.now(),
          },
        ],
        nextCursor: null,
      });

      const response = await request(app)
        .get(`/chat/${chatId}/messages?limit=50`)
        .set("Authorization", `Bearer ${createToken(userId)}`);

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(messageService.getMessages).toHaveBeenCalledWith(
        chatId,
        50,
        undefined,
        userId,
      );
    });

    it("should reject invalid pagination limits", async () => {
      const response = await request(app)
        .get(`/chat/${chatId}/messages?limit=200`)
        .set("Authorization", `Bearer ${createToken(userId)}`);

      expect(response.status).toBe(400);
      expect(messageService.getMessages).not.toHaveBeenCalled();
    });

    it("should reject requests without JWT", async () => {
      const response = await request(app).get(`/chat/${chatId}/messages`);

      expect(response.status).toBe(401);
    });
  });

  describe("POST /chat/:chatId/message/:messageId/read", () => {
    it("should mark a message as read", async () => {
      vi.mocked(messageService.markMessageRead).mockResolvedValue({
        success: true,
        message: "Message marked as read",
      });

      const response = await request(app)
        .post(`/chat/${chatId}/message/${messageId}/read`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({ userId });

      expect(response.status).toBe(200);
      expect(messageService.markMessageRead).toHaveBeenCalledWith(
        chatId,
        messageId,
        { userId },
      );
    });

    it("should reject another user's read receipt", async () => {
      const response = await request(app)
        .post(`/chat/${chatId}/message/${messageId}/read`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({
          userId: "550e8400-e29b-41d4-a716-446655440099",
        });

      expect(response.status).toBe(403);
      expect(messageService.markMessageRead).not.toHaveBeenCalled();
    });
  });

  describe("POST /chat/:chatId/lastseen", () => {
    it("should update last-seen message", async () => {
      vi.mocked(messageService.updateLastSeen).mockResolvedValue({
        success: true,
        message: "Last seen updated successfully",
      });

      const response = await request(app)
        .post(`/chat/${chatId}/lastseen`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({ userId, messageId });

      expect(response.status).toBe(200);
      expect(messageService.updateLastSeen).toHaveBeenCalledWith(chatId, {
        userId,
        messageId,
      });
    });

    it("should reject updating another user's last seen", async () => {
      const response = await request(app)
        .post(`/chat/${chatId}/lastseen`)
        .set("Authorization", `Bearer ${createToken(userId)}`)
        .send({
          userId: "550e8400-e29b-41d4-a716-446655440099",
          messageId,
        });

      expect(response.status).toBe(403);
      expect(messageService.updateLastSeen).not.toHaveBeenCalled();
    });
  });
});
