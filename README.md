# AetherChat

AetherChat is a full-stack, real-time chat application designed to match the core features and smooth messaging flow of WhatsApp. It connects users instantly over secure WebSocket lines, tracks online presence, and saves chat history safely in a database.

## 🚀 Features

- **Instant Messaging:** Uses WebSockets to send and receive messages instantly without page reloads.
- **WhatsApp-Style Status Ticks:** Displays a single gray checkmark when a message is sent, two gray checkmarks when delivered to an online user, and two blue checkmarks when the recipient opens the chat.
- **Live Presence Tracking:** Shows real-time "online" or "offline" status indicators next to user profiles and inside active chat headers.
- **Smart History Logs:** Saves all messages to a database so unread text sent while a user is offline is waiting for them the next time they log in.
- **Dynamic Sorting & Unread Badges:** Keeps count of unread messages per thread and automatically moves the most recently active chat to the top of the sidebar list.
- **Smart Date & Time Formatting:** Displays timestamps in a 12-hour AM/PM format, automatically grouping timelines under "Today," "Yesterday," or absolute calendar dates.
- **Auto-Expanding Input Dock:** Features a text input field that automatically grows as you type long messages, matching premium mobile and web chat setups.

## 💻 Tech Stack

- **Frontend:** React, TypeScript, Ant Design, Styled Components, Axios
- **Backend:** Node.js, Express, TypeScript, `ws` (WebSockets), JSON Web Tokens (JWT)
- **Database & ORM:** PostgreSQL, Prisma ORM
