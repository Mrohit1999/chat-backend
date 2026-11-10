import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { firestore } from "../config/firebase.ts";
import { prisma } from "../config/database.ts";

import type {
  SendMessageInput,
  MarkMessageReadInput,
  UpdateLastSeenInput,
  ChatMessage,
} from "../types/message.types.ts";
import { AppError } from "../middleware/error.middleware.ts";

const chatRef = (chatId: string) => firestore.collection("chats").doc(chatId);

const messageRef = (chatId: string, messageId: string) =>
  chatRef(chatId).collection("messages").doc(messageId);

const assertMember = async (chatId: string, userId: string): Promise<void> => {
  const membership = await prisma.chatMember.findUnique({
    where: {
      chatId_userId: {
        chatId,
        userId,
      },
    },
  });

  if (!membership) {
    throw new AppError(403, "User is not a member of this chat");
  }
};

const formatMessage = (
  chatId: string,
  id: string,
  data: FirebaseFirestore.DocumentData,
): ChatMessage => ({
  id,
  chatId,
  senderId: data.senderId as string,
  text: data.text as string,
  createdAt: data.createdAt as Timestamp,
});

export const messageService = {
  async sendMessage(chatId: string, input: SendMessageInput) {
    await assertMember(chatId, input.senderId);

    const text = input.text.trim();

    if (!text) {
      throw new AppError(400, "Message cannot be empty");
    }

    const ref = chatRef(chatId).collection("messages").doc();

    const createdAt = Timestamp.now();

    await ref.set({
      senderId: input.senderId,
      text,
      createdAt,
    });

    return {
      success: true,
      message: {
        id: ref.id,
        chatId,
        senderId: input.senderId,
        text,
        createdAt,
      } satisfies ChatMessage,
    };
  },

  async getMessages(
    chatId: string,
    limit = 50,
    cursor?: string,
    userId?: string,
  ) {
    if (!userId) {
      throw new AppError(404, "Authenticated user is required");
    }

    await assertMember(chatId, userId);

    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 100);

    const collection = chatRef(chatId).collection("messages");

    let query = collection
      .orderBy("createdAt", "desc")
      .orderBy("__name__", "desc")
      .limit(pageSize + 1);

    if (cursor) {
      const cursorDoc = await collection.doc(cursor).get();

      if (!cursorDoc.exists) {
        throw new AppError(409, "Invalid message cursor");
      }

      const timestamp = cursorDoc.get("createdAt");

      if (!(timestamp instanceof Timestamp)) {
        throw new AppError(409, "Invalid message cursor");
      }

      query = query.startAfter(timestamp, cursorDoc.id);
    }

    const snapshot = await query.get();

    const docs = snapshot.docs.slice(0, pageSize);
    const hasMore = snapshot.docs.length > pageSize;

    return {
      success: true,
      messages: docs.map((doc) => formatMessage(chatId, doc.id, doc.data())),
      nextCursor: hasMore ? (docs[docs.length - 1]?.id ?? null) : null,
    };
  },

  async markMessageRead(
    chatId: string,
    messageId: string,
    input: MarkMessageReadInput,
  ) {
    await assertMember(chatId, input.userId);

    const message = await messageRef(chatId, messageId).get();

    if (!message.exists) {
      throw new AppError(404, "Message not found");
    }

    const receiptId = `${messageId}_${input.userId}`;

    await chatRef(chatId).collection("readReceipts").doc(receiptId).set(
      {
        messageId,
        userId: input.userId,
        readAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      success: true,
      message: "Message marked as read",
    };
  },

  async updateLastSeen(chatId: string, input: UpdateLastSeenInput) {
    await assertMember(chatId, input.userId);

    const targetMessage = await messageRef(chatId, input.messageId).get();

    if (!targetMessage.exists) {
      throw new Error("Message not found");
    }

    const targetTime = targetMessage.get("createdAt");

    if (!(targetTime instanceof Timestamp)) {
      throw new Error("Invalid message timestamp");
    }

    const ref = chatRef(chatId).collection("lastSeen").doc(input.userId);

    await firestore.runTransaction(async (transaction) => {
      const current = await transaction.get(ref);

      if (current.exists) {
        const currentTime = current.get("messageCreatedAt");

        if (
          currentTime instanceof Timestamp &&
          currentTime.toMillis() > targetTime.toMillis()
        ) {
          return;
        }

        if (
          currentTime instanceof Timestamp &&
          currentTime.isEqual(targetTime) &&
          String(current.get("messageId")) >= input.messageId
        ) {
          return;
        }
      }

      transaction.set(ref, {
        userId: input.userId,
        messageId: input.messageId,
        messageCreatedAt: targetTime,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      success: true,
      message: "Last seen updated successfully",
    };
  },
};
