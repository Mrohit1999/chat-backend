import { FieldPath, FieldValue, Timestamp } from "firebase-admin/firestore";

import { firestore } from "../config/firebase.ts";

const getChatRef = (chatId: string) =>
  firestore.collection("chats").doc(chatId);

const getMessagesRef = (chatId: string) =>
  getChatRef(chatId).collection("messages");

export const messageRepository = {
  async create(chatId: string, senderId: string, text: string) {
    const docRef = getMessagesRef(chatId).doc();
    const createdAt = Timestamp.now();

    await docRef.set({
      senderId,
      text,
      createdAt,
    });

    return {
      id: docRef.id,
      chatId,
      senderId,
      text,
      createdAt,
    };
  },

  async findById(chatId: string, messageId: string) {
    const snapshot = await getMessagesRef(chatId).doc(messageId).get();

    if (!snapshot.exists) {
      return null;
    }

    return {
      id: snapshot.id,
      chatId,
      ...snapshot.data(),
    };
  },

  async findMessages(chatId: string, limit: number = 50, cursor?: string) {
    const pageSize = Math.min(Math.max(Math.trunc(limit), 1), 100);

    const collection = getMessagesRef(chatId);

    let query = collection
      .orderBy("createdAt", "desc")
      .orderBy(FieldPath.documentId(), "desc")
      .limit(pageSize + 1);

    if (cursor) {
      const cursorSnapshot = await collection.doc(cursor).get();

      if (!cursorSnapshot.exists) {
        throw new Error("Invalid message cursor");
      }

      query = query.startAfter(cursorSnapshot);
    }

    const snapshot = await query.get();

    const hasMore = snapshot.docs.length > pageSize;
    const docs = snapshot.docs.slice(0, pageSize);

    return {
      messages: docs.map((doc) => ({
        id: doc.id,
        chatId,
        ...doc.data(),
      })),
      nextCursor: hasMore ? (docs[docs.length - 1]?.id ?? null) : null,
    };
  },

  async markAsRead(chatId: string, messageId: string, userId: string) {
    const receiptId = `${messageId}_${userId}`;

    const receiptRef = getChatRef(chatId)
      .collection("readReceipts")
      .doc(receiptId);

    // create() keeps the original readAt on repeated requests.
    try {
      await receiptRef.create({
        messageId,
        userId,
        readAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      const code = (error as { code?: number | string }).code;

      // Firestore ALREADY_EXISTS
      if (code !== 6 && code !== "6" && code !== "already-exists") {
        throw error;
      }
    }

    return {
      messageId,
      userId,
    };
  },

  async findReadReceipt(chatId: string, messageId: string, userId: string) {
    const receiptId = `${messageId}_${userId}`;

    const snapshot = await getChatRef(chatId)
      .collection("readReceipts")
      .doc(receiptId)
      .get();

    return snapshot.exists ? snapshot.data() : null;
  },

  async updateLastSeen(chatId: string, userId: string, messageId: string) {
    const messageSnapshot = await getMessagesRef(chatId).doc(messageId).get();

    if (!messageSnapshot.exists) {
      throw new Error("Message not found");
    }

    const messageCreatedAt = messageSnapshot.get("createdAt");

    if (!(messageCreatedAt instanceof Timestamp)) {
      throw new Error("Invalid message timestamp");
    }

    const lastSeenRef = getChatRef(chatId).collection("lastSeen").doc(userId);

    await firestore.runTransaction(async (transaction) => {
      const current = await transaction.get(lastSeenRef);

      if (current.exists) {
        const currentTime = current.get("messageCreatedAt");
        const currentMessageId = current.get("messageId");

        if (currentTime instanceof Timestamp) {
          if (currentTime.toMillis() > messageCreatedAt.toMillis()) {
            return;
          }

          if (
            currentTime.isEqual(messageCreatedAt) &&
            String(currentMessageId) >= messageId
          ) {
            return;
          }
        }
      }

      transaction.set(lastSeenRef, {
        userId,
        messageId,
        messageCreatedAt,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return {
      userId,
      messageId,
    };
  },

  async findLastSeen(chatId: string, userId: string) {
    const snapshot = await getChatRef(chatId)
      .collection("lastSeen")
      .doc(userId)
      .get();

    return snapshot.exists ? snapshot.data() : null;
  },
};
