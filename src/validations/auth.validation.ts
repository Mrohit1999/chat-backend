import { z } from "zod";

// Register user validation
export const registerSchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(2, "Name must contain at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.email("Please enter a valid email address").trim().toLowerCase(),

  password: z
    .string()
    .min(8, "Password must contain at least 8 characters")
    .max(128, "Password cannot exceed 128 characters"),
});

// Login user validation
export const loginSchema = z.strictObject({
  email: z.email("Please enter a valid email address").trim().toLowerCase(),

  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
