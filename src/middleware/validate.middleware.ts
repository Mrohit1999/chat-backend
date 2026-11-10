import type { Request, Response, NextFunction, RequestHandler } from "express";

import type { ZodType } from "zod";

type RequestPart = "body" | "params" | "query";

export const validate = (
  schema: ZodType,
  source: RequestPart = "body",
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    next();
  };
};
