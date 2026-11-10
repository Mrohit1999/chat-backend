import type { Timestamp } from "firebase-admin/firestore";
import type { ParamsDictionary } from "express-serve-static-core";

export interface SendMessageInput {
  senderId: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: Timestamp;
}

export interface SendMessageResponse {
  success: boolean;
  message: ChatMessage;
}

export interface GetMessagesQuery {
  limit?: string;
  cursor?: string;
}

export interface GetMessagesResponse {
  success: boolean;
  messages: ChatMessage[];
  nextCursor: string | null;
}

export interface MarkMessageReadInput {
  userId: string;
}

export interface ReadReceipt {
  messageId: string;
  userId: string;
  readAt: Timestamp;
}

export interface MarkMessageReadResponse {
  success: boolean;
  message: string;
}

export interface UpdateLastSeenInput {
  userId: string;
  messageId: string;
}

export interface LastSeen {
  userId: string;
  messageId: string;
  updatedAt: Timestamp;
}

export interface UpdateLastSeenResponse {
  success: boolean;
  message: string;
}

export interface MessageParams extends ParamsDictionary {
  chatId: string;
  messageId: string;
}
