import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { api } from "@shared/routes";
import { z } from "zod";
import { customAlphabet } from "nanoid";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  setupAuth(app);

  // Room Routes
  app.post(api.rooms.create.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as { id: number } | undefined)?.id;
    if (!userId) return res.sendStatus(401);
    const generateCode = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
    const code = generateCode();
    const room = await storage.createRoom(userId, code);
    await storage.addUserToRoom(room.id, userId, true);
    res.status(201).json(room);
  });

  app.post(api.rooms.join.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const userId = (req.user as { id: number } | undefined)?.id;
    if (!userId) return res.sendStatus(401);
    const { code } = req.body;
    const room = await storage.getRoomByCode(code);
    if (!room) return res.status(404).json({ message: "Room not found" });
    
    await storage.addUserToRoom(room.id, userId);
    res.json(room);
  });

  app.get(api.rooms.get.path, async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const room = await storage.getRoom(Number(req.params.id));
    if (!room) return res.status(404).json({ message: "Room not found" });
    const users = await storage.getRoomUsers(room.id);
    res.json({ ...room, users });
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
    let currentClient: { roomId: number; userId: number } | null = null;
    // In a real app, we'd parse the session from cookie here.
    // For MVP, we'll expect a 'join' message with roomId and userId (validated somewhat loosely, relying on HTTP auth mostly)
    
    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "join_room") {
          const { roomId, userId } = message;
          if (!roomId || !userId) return;
          // Verify user belongs to room?
          clients.set(userId, { ws, roomId, userId });
          currentClient = { roomId, userId };
          
          // Broadcast user joined
          broadcast(roomId, { type: "game_update", roomId });
          ws.send(JSON.stringify({ type: "game_update", roomId }));
        }

        if (message.type === "chat") {
          if (!currentClient) return;
          
          const dbMsg = await storage.createMessage(currentClient.roomId, currentClient.userId, message.content, "chat", message.team);
          const sender = await storage.getUser(currentClient.userId);
          broadcast(currentClient.roomId, { type: "chat", message: { ...dbMsg, username: sender?.username || "User" } });
        }

        if (message.type === "team_change") {
          if (!currentClient) return;
          
          await storage.updateRoomUser(currentClient.roomId, currentClient.userId, { team: message.team });
          broadcast(currentClient.roomId, { type: "game_update", roomId: currentClient.roomId });
        }
        
        if (message.type === "spin") {
           if (!currentClient) return;
           
           // Simple random selection
           const users = await storage.getRoomUsers(currentClient.roomId);
           const eligible = users.filter(u => u.team !== 'spectator');
           if (eligible.length > 0) {
             const selected = eligible[Math.floor(Math.random() * eligible.length)];
             
             // Get a question
             const question = await storage.getRandomQuestion();

             broadcast(currentClient.roomId, { 
               type: "spin_result", 
               userId: selected.userId,
               question: question
             });
           }
        }

        if (message.type === "start_game") {
          if (!currentClient) return;

          const room = await storage.getRoom(currentClient.roomId);
          if (!room) {
            ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
            return;
          }

          if (room.hostId !== currentClient.userId) {
            ws.send(JSON.stringify({ type: "error", message: "Only the host can start the game" }));
            return;
          }

          if (room.status !== "playing") {
            await storage.updateRoom(room.id, { status: "playing" });
          }

          broadcast(currentClient.roomId, { type: "game_update", roomId: currentClient.roomId });
        }

        if (message.type === "wrong_answer") {
          if (!currentClient) return;

          const { roomId, userId } = currentClient;
          const roomUsers = await storage.getRoomUsers(roomId);
          const roomUser = roomUsers.find(u => u.userId === userId);
          const team = roomUser?.team;
          if (!team || team === "spectator") return;

          broadcast(roomId, { type: "wrong_answer", team, userId });
        }

        if (message.type === "submit_team_question") {
          if (!currentClient) return;

          const { roomId, userId } = currentClient;
          const roomUsers = await storage.getRoomUsers(roomId);
          const roomUser = roomUsers.find(u => u.userId === userId);
          const team = roomUser?.team;
          if (!team || team === "spectator") return;

          // Clear any previous team question for this room
          await storage.clearTeamQuestionForRoom(roomId);
          const q = await storage.createTeamQuestion(roomId, message.question, message.answer, team as 'red' | 'blue');

          // Broadcast question state: author team sees question+answer; opposing team sees only question and can answer
          broadcast(roomId, {
            type: "question_state",
            roomId,
            question: q.text,
            authorTeam: team as 'red' | 'blue',
            canAnswer: false, // author team cannot answer
          });
        }

        if (message.type === "select_player") {
          if (!currentClient) return;

          const { roomId, userId } = currentClient;
          const roomUsers = await storage.getRoomUsers(roomId);
          const roomUser = roomUsers.find(u => u.userId === userId);
          const team = roomUser?.team;
          if (!team || team === "spectator") return;

          const q = await storage.getTeamQuestionForRoom(roomId);
          if (!q) return;

          const opposingTeam = q.authorTeam === 'red' ? 'blue' : 'red';
          if (team !== opposingTeam) {
            ws.send(JSON.stringify({ type: "error", message: "Only the opposing team can select a player to answer." }));
            return;
          }

          // Broadcast that a player was selected and start the timer
          broadcast(roomId, {
            type: "question_state",
            roomId,
            question: q.text,
            authorTeam: q.authorTeam,
            canAnswer: true,
            selectedPlayerId: message.playerId,
            timeLeft: 20,
          });
          startAnswerTimer(roomId, opposingTeam);
        }

        if (message.type === "answer_question") {
          if (!currentClient) return;

          const { roomId, userId } = currentClient;
          const roomUsers = await storage.getRoomUsers(roomId);
          const roomUser = roomUsers.find(u => u.userId === userId);
          const answeringTeam = roomUser?.team;
          if (!answeringTeam || answeringTeam === "spectator") return;

          const q = await storage.getTeamQuestionForRoom(roomId);
          if (!q) return;

          const isCorrect = q.answer.trim().toLowerCase() === message.answer.trim().toLowerCase();
          const opposingTeam = q.authorTeam === 'red' ? 'blue' : 'red';

          if (answeringTeam !== opposingTeam) {
            ws.send(JSON.stringify({ type: "error", message: "It's not your team's turn to answer!" }));
            return;
          }

          // Clear timer on answer
          clearTimer(roomId);

          if (isCorrect) {
            // Update scores
            const room = await storage.getRoom(roomId);
            if (!room) return;
            const scoreField = answeringTeam === 'red' ? 'redScore' : 'blueScore';
            await storage.updateRoom(roomId, { [scoreField]: (room as any)[scoreField] + 1 });

            // Clear the question
            await storage.clearTeamQuestionForRoom(roomId);

            broadcast(roomId, {
              type: "answer_result",
              roomId,
              correct: true,
              answeringTeam,
              question: q.text,
              answer: q.answer,
            });
            broadcast(roomId, { type: "game_update", roomId });
          } else {
            broadcast(roomId, {
              type: "answer_result",
              roomId,
              correct: false,
              answeringTeam,
              question: q.text,
            });
            broadcast(roomId, { type: "wrong_answer", team: answeringTeam, userId });
          }
        }

      } catch (e) {
        console.error("WS Error", e);
      }
    });

    ws.on("close", () => {
      // Clean up
      if (currentClient) clients.delete(currentClient.userId);
      currentClient = null;
    });
  });

  // Track active question timers per room
  const activeTimers = new Map<number, NodeJS.Timeout>();

  function clearTimer(roomId: number) {
    const timer = activeTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.delete(roomId);
    }
  }

  function startAnswerTimer(roomId: number, answeringTeam: 'red' | 'blue') {
    clearTimer(roomId);
    let timeLeft = 20;
    const timer = setInterval(() => {
      timeLeft -= 1;
      broadcast(roomId, { type: "question_state", roomId, question: "", authorTeam: answeringTeam, canAnswer: true, timeLeft });
      if (timeLeft <= 0) {
        clearInterval(timer);
        activeTimers.delete(roomId);
        // Auto-fail
        broadcast(roomId, { type: "answer_result", roomId, correct: false, answeringTeam, question: "" });
        broadcast(roomId, { type: "wrong_answer", team: answeringTeam, userId: 0 });
        // Clear the question
        storage.clearTeamQuestionForRoom(roomId);
      }
    }, 1000);
    activeTimers.set(roomId, timer);
  }

  function broadcast(roomId: number, message: any) {
    const payload = JSON.stringify(message);
    clients.forEach((client) => {
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
