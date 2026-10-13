import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret_key";

export async function register(req: Request, res: Response) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "Username, email, and password are required." });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanUsername, mode: "insensitive" } },
          { email: cleanEmail },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === cleanEmail) {
        return res.status(400).json({ error: "Email is already registered." });
      }
      return res.status(400).json({ error: "Username is already taken." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: cleanUsername,
        email: cleanEmail,
        password: hashedPassword,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        instagramUrl: true,
        createdAt: true,
      },
    });

    const token = jwt.sign(
      { userId: newUser.id, username: newUser.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(201).json({
      message: "User registered successfully!",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("Registration Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during registration." });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const identifierInput =
      req.body.identifier || req.body.username || req.body.email;
    const { password } = req.body;

    if (!identifierInput || !password) {
      return res
        .status(400)
        .json({ error: "Username or Email and password are required." });
    }

    const cleanIdentifier = identifierInput.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: cleanIdentifier, mode: "insensitive" } },
          { email: cleanIdentifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );

    return res.status(200).json({
      message: "Login successful!",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        githubUrl: user.githubUrl,
        linkedinUrl: user.linkedinUrl,
        websiteUrl: user.websiteUrl,
        instagramUrl: user.instagramUrl,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res
      .status(500)
      .json({ error: "Internal server error during login." });
  }
}

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
) => {
  try {
    const userId = req.user?.userId;
    const {
      username,
      email,
      avatarUrl,
      bio,
      githubUrl,
      linkedinUrl,
      websiteUrl,
      instagramUrl,
    } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized request." });
    }

    if (!username || !username.trim() || !email || !email.trim()) {
      return res
        .status(400)
        .json({ error: "Username and email are required fields." });
    }

    const cleanUsername = username.trim();
    const cleanEmail = email.trim().toLowerCase();

    const existingUsername = await prisma.user.findFirst({
      where: {
        username: { equals: cleanUsername, mode: "insensitive" },
        NOT: { id: userId },
      },
    });

    if (existingUsername) {
      return res.status(400).json({ error: "Username is already taken." });
    }

    const existingEmail = await prisma.user.findFirst({
      where: {
        email: cleanEmail,
        NOT: { id: userId },
      },
    });

    if (existingEmail) {
      return res.status(400).json({ error: "Email is already in use." });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        username: cleanUsername,
        email: cleanEmail,
        avatarUrl,
        bio,
        githubUrl,
        linkedinUrl,
        websiteUrl,
        instagramUrl,
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        instagramUrl: true,
      },
    });

    return res.status(200).json({
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update profile:", error);
    return res
      .status(500)
      .json({ error: "Internal server error updating profile." });
  }
};


export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized request." });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        avatarUrl: true,
        bio: true,
        githubUrl: true,
        linkedinUrl: true,
        websiteUrl: true,
        instagramUrl: true, 
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error("Failed to fetch current user:", error);
    return res.status(500).json({ error: "Internal server error." });
  }
};