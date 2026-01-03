import { db } from "./db";
import {
  users, rooms, roomUsers, messages, questions,
  type User, type InsertUser, type Room, type RoomUser, type Message, type Question
} from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  createRoom(hostId: number, code: string): Promise<Room>;
  getRoom(id: number): Promise<Room | undefined>;
  getRoomByCode(code: string): Promise<Room | undefined>;
  updateRoom(id: number, updates: Partial<Room>): Promise<Room>;

  addUserToRoom(roomId: number, userId: number, isHost?: boolean): Promise<RoomUser>;
  removeUserFromRoom(roomId: number, userId: number): Promise<void>;
  getRoomUsers(roomId: number): Promise<(RoomUser & { user: User })[]>;
  updateRoomUser(roomId: number, userId: number, updates: Partial<RoomUser>): Promise<RoomUser>;

  createMessage(roomId: number, userId: number, content: string, type?: string, team?: string): Promise<Message>;
  getRoomMessages(roomId: number): Promise<(Message & { username: string })[]>;
  
  getQuestions(): Promise<Question[]>;
  createQuestion(question: { text: string; answer: string; category?: string; difficulty?: string }): Promise<Question>;
  getRandomQuestion(): Promise<Question | undefined>;

  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createRoom(hostId: number, code: string): Promise<Room> {
    const [room] = await db.insert(rooms).values({ 
      hostId, 
      code,
      status: "lobby",
      currentTeam: "red"
    }).returning();
    return room;
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room;
  }

  async getRoomByCode(code: string): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.code, code));
    return room;
  }

  async updateRoom(id: number, updates: Partial<Room>): Promise<Room> {
    const [updated] = await db.update(rooms).set(updates).where(eq(rooms.id, id)).returning();
    return updated;
  }

  async addUserToRoom(roomId: number, userId: number, isHost = false): Promise<RoomUser> {
    // Check if exists
    const [existing] = await db.select().from(roomUsers).where(and(eq(roomUsers.roomId, roomId), eq(roomUsers.userId, userId)));
    if (existing) return existing;

    const [roomUser] = await db.insert(roomUsers).values({
      roomId,
      userId,
      isHost,
      team: "spectator"
    }).returning();
    return roomUser;
  }

  async removeUserFromRoom(roomId: number, userId: number): Promise<void> {
    await db.delete(roomUsers).where(and(eq(roomUsers.roomId, roomId), eq(roomUsers.userId, userId)));
  }

  async getRoomUsers(roomId: number): Promise<(RoomUser & { user: User })[]> {
    const results = await db.select({
      roomUser: roomUsers,
      user: users
    })
    .from(roomUsers)
    .innerJoin(users, eq(roomUsers.userId, users.id))
    .where(eq(roomUsers.roomId, roomId));
    
    return results.map(r => ({ ...r.roomUser, user: r.user }));
  }

  async updateRoomUser(roomId: number, userId: number, updates: Partial<RoomUser>): Promise<RoomUser> {
    const [updated] = await db.update(roomUsers)
      .set(updates)
      .where(and(eq(roomUsers.roomId, roomId), eq(roomUsers.userId, userId)))
      .returning();
    return updated;
  }

  async createMessage(roomId: number, userId: number, content: string, type = "chat", team?: string): Promise<Message> {
    const [message] = await db.insert(messages).values({
      roomId,
      userId,
      content,
      type,
      team: team as any
    }).returning();
    return message;
  }

  async getRoomMessages(roomId: number): Promise<(Message & { username: string })[]> {
    const results = await db.select({
      message: messages,
      user: users
    })
    .from(messages)
    .innerJoin(users, eq(messages.userId, users.id))
    .where(eq(messages.roomId, roomId))
    .orderBy(messages.createdAt);
    
    return results.map(r => ({ ...r.message, username: r.user.username }));
  }

  async getQuestions(): Promise<Question[]> {
    return await db.select().from(questions);
  }

  async createQuestion(question: { text: string; answer: string; category?: string; difficulty?: string }): Promise<Question> {
    const [q] = await db.insert(questions).values(question).returning();
    return q;
  }

  async getRandomQuestion(): Promise<Question | undefined> {
    const [q] = await db.select().from(questions).orderBy(sql`RANDOM()`).limit(1);
    return q;
  }
}

export const storage = new DatabaseStorage();
