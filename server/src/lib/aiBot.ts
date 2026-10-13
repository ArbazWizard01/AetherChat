import { prisma } from "./prisma.js";

export const AETHER_BOT_EMAIL = "aetherbot@system.internal";
export const AETHER_BOT_USERNAME = "AetherBot";

export const AETHER_BOT_AVATAR =
  "https://api.dicebear.com/7.x/bottts/svg?seed=AetherBot&backgroundColor=0284c7";

let cachedBotId: string | null = null;

export async function getOrSeedAetherBot(): Promise<string> {
  if (cachedBotId) return cachedBotId;

  const botUser = await prisma.user.upsert({
    where: { email: AETHER_BOT_EMAIL },
    update: {
      isOnline: true,
      avatarUrl: AETHER_BOT_AVATAR,
    },
    create: {
      username: AETHER_BOT_USERNAME,
      email: AETHER_BOT_EMAIL,
      password: "SYSTEM_ACCOUNT_NO_LOGIN",
      avatarUrl: AETHER_BOT_AVATAR,
      bio: "Official AI Assistant powered by Gemini 3.6 Flash 🚀",
      isOnline: true,
    },
  });

  cachedBotId = botUser.id;
  return botUser.id;
}
