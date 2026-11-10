export type ChatType = "DIRECT" | "GROUP";

export interface CreateChatInput {
  userAId: string;
  userBId: string;
}

export interface ChatMember {
  userId: string;
  chatId: string;
  joinedAt: Date;
}

export interface ChatResponse {
  id: string;
  type: ChatType;
  createdAt: Date;
  members: ChatMember[];
}

export interface CreateChatResponse {
  success: boolean;
  message: string;
  chatId: string;
}

export interface UserChatsResponse {
  success: boolean;
  chats: ChatResponse[];
}

import type { ParamsDictionary } from "express-serve-static-core";

export interface UserParams extends ParamsDictionary {
  userId: string;
}

export interface ChatParams extends ParamsDictionary {
  chatId: string;
}
