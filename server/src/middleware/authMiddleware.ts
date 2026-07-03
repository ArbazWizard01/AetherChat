import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export const authenticateJWT = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Access denied. Access token missing or malformed." });
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied. Token payload is empty." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as {
      userId: string;
      username: string;
    };

    req.user = decoded;
    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Access forbidden. Token is invalid or expired." });
  }
};
