import { WebSocketServer, WebSocket } from "ws";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common";
import { prisma } from "@repo/db";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  userId: string;
  rooms: string[];
}

const users: User[] = [];

function checkUserToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (
      !decoded ||
      typeof decoded === "string" ||
      !(decoded as JwtPayload).userId
    ) {
      return null;
    }

    return (decoded as JwtPayload).userId;
  } catch {
    return null;
  }
}

wss.on("connection", function connection(ws: WebSocket, request: any) {
  const url = request.url;

  if (!url) {
    ws.close(1008, "Missing URL");
    return;
  }

  const queryString = url.includes("?") ? url.split("?")[1] : "";
  const queryParams = new URLSearchParams(queryString);

  const token = queryParams.get("token") || "";
  const userId = checkUserToken(token);

  if (!userId) {
    ws.close(1008, "Invalid or missing token");
    return;
  }

  const user: User = {
    userId,
    rooms: [],
    ws,
  };

  users.push(user);

  console.log(`User connected: ${userId}`);

  ws.on("error", console.error);

  ws.on("close", () => {
    const index = users.findIndex((u) => u.ws === ws);
    if (index !== -1) {
      users.splice(index, 1);
      console.log(`User disconnected: ${userId}`);
    }
  });

  ws.on("message", async function message(data) {

   
    let parsedData: any;

    try {
      parsedData = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (!parsedData?.type) return;

    if (parsedData.type === "join_room") {
      if (!parsedData.roomId) return;

      const user = users.find((x) => x.ws === ws);
      if (!user) return;

      if (!user.rooms.includes(parsedData.roomId)) {
        user.rooms.push(parsedData.roomId);
      }
      
      console.log("JOINED:", user.userId, user.rooms);

    }
    console.log(users.map(u => ({
       userId: u.userId,
       rooms: u.rooms
     })));

    if (parsedData.type === "leave_room") {
      if (!parsedData.roomId) return;

      const user = users.find((x) => x.ws === ws);
      if (!user) return;

      user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
    }

    if (parsedData.type === "chat") {
      const { roomId, message } = parsedData;

      if (!roomId || typeof message !== "string") return;

      await prisma.chat.create({
        data: {
          roomId,
          userId,
          message,
        }
      })

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message,
              roomId,
            })
          );
        }
      });
    }
  });
});


console.log("WebSocket server running on ws://localhost:8080");