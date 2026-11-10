import type { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

import { env } from "../config/env.ts";
import type { JwtPayload } from "../types/auth.types.ts";

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({
      success: false,
      message: "Authorization header is missing",
    });
    return;
  }

  const [scheme, token, extra] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token || extra) {
    res.status(401).json({
      success: false,
      message: "Authorization must use Bearer token",
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      algorithms: ["HS256"],
    });

    if (
      typeof decoded === "string" ||
      typeof decoded.userId !== "string" ||
      !decoded.userId
    ) {
      res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
      return;
    }

    const user: JwtPayload = {
      userId: decoded.userId,
    };

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Authentication token has expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
      return;
    }

    next(error);
  }
};
