import { GoogleGenAI } from "@google/genai";
import { prisma } from "../lib/prisma.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generateAetherResponse(
  conversationId: string,
  promptText: string,
): Promise<string> {
  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    take: 8,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { username: true },
      },
    },
  });

  const formattedContext = recentMessages
    .reverse()
    .map(
      (msg: { user: { username: string }; text: string }) =>
        `${msg.user.username}: ${msg.text}`,
    )
    .join("\n");

  const cleanPrompt = promptText.replace(/@AetherBot/gi, "").trim();

  const systemInstruction = `You are AetherBot, a friendly and intelligent assistant in the AetherChat platform. Keep answers concise, helpful, and formatted neatly with markdown when appropriate.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.6-flash",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `${systemInstruction}\n\nChat History:\n${formattedContext}\n\nCurrent Prompt: ${cleanPrompt}`,
          },
        ],
      },
    ],
  });

  return response.text || "I was unable to process that request.";
}
