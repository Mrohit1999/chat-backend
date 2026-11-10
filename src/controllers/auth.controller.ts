import type { Request, Response } from "express";

import { authService } from "../services/auth.service.ts";

import type { RegisterUserInput, LoginUserInput } from "../types/auth.types.ts";

export const authController = {
  async register(
    req: Request<{}, {}, RegisterUserInput>,
    res: Response,
  ): Promise<void> {
    const result = await authService.register(req.body);

    res.status(201).json(result);
  },

  async login(
    req: Request<{}, {}, LoginUserInput>,
    res: Response,
  ): Promise<void> {
    const result = await authService.login(req.body);

    res.status(200).json(result);
  },
};
