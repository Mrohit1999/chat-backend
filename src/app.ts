import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";

import routes from "./routes/index.routes";
import { errorMiddleware } from "./middleware/error.middleware";

const app: Application = express();

// Security middleware
app.disable("x-powered-by");
app.use(helmet());

// CORS middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Request body parsing
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true }));

// HTTP request logging
app.use(
  pinoHttp({
    redact: ["req.headers.authorization"],
  }),
);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Chat backend is running",
    timestamp: new Date().toISOString(),
  });
});

// Centralized API routes
app.use(routes);

// Handle unknown routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
  });
});

// Global error handling
app.use(errorMiddleware);

export { app };
