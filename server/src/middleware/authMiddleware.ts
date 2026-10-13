import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_super_secret_key";

export interface AuthenticatedUser {
  userId: string;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
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
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId?: string;
      id?: string;
      _id?: string;
      username: string;
    };

    const targetUserId = decoded.userId || decoded.id || decoded._id;

    if (!targetUserId) {
      return res
        .status(403)
        .json({ error: "Access forbidden. Malformed identifier footprint." });
    }

    req.user = {
      userId: String(targetUserId),
      username: decoded.username || "",
    };

    next();
  } catch (error) {
    return res
      .status(403)
      .json({ error: "Access forbidden. Token is invalid or expired." });
  }
};