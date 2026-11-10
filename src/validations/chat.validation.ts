import { z } from "zod";

// Create direct chat validation
export const createChatSchema = z
  .strictObject({
    userAId: z.uuid("Invalid userAId"),
    userBId: z.uuid("Invalid userBId"),
  })
  .refine((data) => data.userAId !== data.userBId, {
    message: "Cannot create a chat with yourself",
    path: ["userBId"],
  });

// Chat ID parameter validation
export const chatParamsSchema = z.object({
  chatId: z.uuid("Invalid chat ID"),
});

// User ID parameter validation
export const userParamsSchema = z.object({
  userId: z.uuid("Invalid user ID"),
});

export type CreateChatInput = z.infer<typeof createChatSchema>;
