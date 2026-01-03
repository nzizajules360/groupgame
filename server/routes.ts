import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { nanoid } from "nanoid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Room Routes
  app.post(api.rooms.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const code = nanoid(6).toUpperCase();
    const room = await storage.createRoom(req.user!.id, code);
    await storage.addUserToRoom(room.id, req.user!.id, true);
    res.status(201).json(room);
  });

  app.post(api.rooms.join.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const { code } = req.body;
    const room = await storage.getRoomByCode(code);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    await storage.addUserToRoom(room.id, req.user!.id);
    res.json(room);
  });

  app.get(api.rooms.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const room = await storage.getRoom(Number(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  });

  app.patch(api.rooms.update.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const room = await storage.updateRoom(Number(req.params.id), req.body);
    res.json(room);
  });

  app.get(api.messages.list.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const messages = await storage.getRoomMessages(Number(req.params.id));
    res.json(messages);
  });

  // WebSocket Setup
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const clients = new Map<number, { ws: WebSocket, roomId: number, userId: number }>();

  wss.on("connection", (ws, req) => {
    // In a real app, we'd parse the session from cookie here.
    // For MVP, we'll expect a 'join' message with roomId and userId (validated somewhat loosely, relying on HTTP auth mostly)
    
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "join") {
          const { roomId, userId } = message;
          // Verify user belongs to room?
          clients.set(userId, { ws, roomId, userId });
          
          // Broadcast user joined
          broadcast(roomId, { type: "user_joined", userId });
          
          // Send current state?
          const users = await storage.getRoomUsers(roomId);
          ws.send(JSON.stringify({ type: "state", users }));
        }

        if (message.type === "chat") {
          const client = [...clients.values()].find(c => c.ws === ws);
          if (!client) return;
          
          const dbMsg = await storage.createMessage(client.roomId, client.userId, message.content, "chat", message.team);
          broadcast(client.roomId, { type: "chat", message: { ...dbMsg, username: "User" } }); // Ideally fetch username
        }

        if (message.type === "team_change") {
          const client = [...clients.values()].find(c => c.ws === ws);
          if (!client) return;
          
          await storage.updateRoomUser(client.roomId, client.userId, { team: message.team });
          const users = await storage.getRoomUsers(client.roomId);
          broadcast(client.roomId, { type: "state", users });
        }
        
        if (message.type === "spin") {
           const client = [...clients.values()].find(c => c.ws === ws);
           if (!client) return;
           
           // Simple random selection
           const users = await storage.getRoomUsers(client.roomId);
           const eligible = users.filter(u => u.team !== 'spectator');
           if (eligible.length > 0) {
             const selected = eligible[Math.floor(Math.random() * eligible.length)];
             
             // Get a question
             const question = await storage.getRandomQuestion();

             broadcast(client.roomId, { 
               type: "spin_result", 
               userId: selected.userId,
               question: question
             });
           }
        }

      } catch (e) {
        console.error("WS Error", e);
      }
    });

    ws.on("close", () => {
      // Clean up
    });
  });

  function broadcast(roomId: number, message: any) {
    const payload = JSON.stringify(message);
    [...clients.values()].forEach(client => {
      if (client.roomId === roomId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(payload);
      }
    });
  }

  // Seeding
  if ((await storage.getQuestions()).length === 0) {
    await storage.createQuestion({ text: "What is the capital of France?", answer: "Paris" });
    await storage.createQuestion({ text: "What has keys but can't open locks?", answer: "Piano" });
    await storage.createQuestion({ text: "What comes once in a minute, twice in a moment, but never in a thousand years?", answer: "The letter M" });
    await storage.createQuestion({ text: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", answer: "Echo" });
  }

  return httpServer;
}
