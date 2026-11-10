import { Router } from "express";

import { authController } from "../controllers/auth.controller.ts";

import { registerSchema, loginSchema } from "../validations/auth.validation.ts";
import { validate } from "../middleware/validate.middleware.ts";
const router = Router();

// Register a new user
router.post("/register", validate(registerSchema), authController.register);

// Login user
router.post("/login", validate(loginSchema), authController.login);

export default router;
