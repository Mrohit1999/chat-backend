import { z } from "zod";

// Send message validation
export const sendMessageSchema = z.strictObject({
  senderId: z.uuid("Invalid sender ID"),

  text: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

// Get messages query validation
export const getMessagesQuerySchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, "Limit must be a positive integer")
    .refine(
      (value) => Number(value) >= 1 && Number(value) <= 100,
      "Limit must be between 1 and 100",
    )
    .optional(),

  cursor: z.string().min(1).optional(),
});

// Mark message as read validation
export const markMessageReadSchema = z.strictObject({
  userId: z.uuid("Invalid user ID"),
});

// Update last-seen validation
export const updateLastSeenSchema = z.strictObject({
  userId: z.uuid("Invalid user ID"),
  messageId: z.string().min(1, "Message ID is required"),
});

// Message route parameters
export const messageParamsSchema = z.object({
  chatId: z.uuid("Invalid chat ID"),
  messageId: z.string().min(1, "Message ID is required"),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type MarkMessageReadInput = z.infer<typeof markMessageReadSchema>;
export type UpdateLastSeenInput = z.infer<typeof updateLastSeenSchema>;
