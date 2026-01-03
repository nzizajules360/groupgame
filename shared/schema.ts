import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  wins: integer("wins").default(0),
  totalGames: integer("total_games").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: integer("host_id").notNull(),
  status: text("status").notNull().default("lobby"), // lobby, playing, finished
  currentTeam: text("current_team").default("red"), // red, blue
  redScore: integer("red_score").default(0),
  blueScore: integer("blue_score").default(0),
  redName: text("red_name").default("Red Team"),
  blueName: text("blue_name").default("Blue Team"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const roomUsers = pgTable("room_users", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(),
  team: text("team"), // red, blue, spectator
  isHost: boolean("is_host").default(false),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomId: integer("room_id").notNull(),
  userId: integer("user_id").notNull(), // 0 for system
  content: text("content").notNull(),
  type: text("type").default("chat"), // chat, system, command, reaction
  team: text("team"), // null for global, 'red', 'blue'
  createdAt: timestamp("created_at").defaultNow(),
});

export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  text: text("text").notNull(),
  answer: text("answer").notNull(),
  category: text("category").default("general"),
  difficulty: text("difficulty").default("medium"),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  roomUsers: many(roomUsers),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  host: one(users, {
    fields: [rooms.hostId],
    references: [users.id],
  }),
  users: many(roomUsers),
  messages: many(messages),
}));

export const roomUsersRelations = relations(roomUsers, ({ one }) => ({
  room: one(rooms, {
    fields: [roomUsers.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [roomUsers.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  room: one(rooms, {
    fields: [messages.roomId],
    references: [rooms.id],
  }),
  user: one(users, {
    fields: [messages.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, wins: true, totalGames: true });
export const insertRoomSchema = createInsertSchema(rooms).omit({ id: true, createdAt: true });
export const insertRoomUserSchema = createInsertSchema(roomUsers).omit({ id: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertQuestionSchema = createInsertSchema(questions).omit({ id: true });

// === EXPLICIT API CONTRACT TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Room = typeof rooms.$inferSelect;
export type RoomUser = typeof roomUsers.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Question = typeof questions.$inferSelect;

export type CreateUserRequest = InsertUser;
export type LoginRequest = Pick<InsertUser, "username" | "password">;

export type CreateRoomRequest = { name?: string }; // just need host logic on server
export type JoinRoomRequest = { code: string };

export type UpdateRoomRequest = Partial<Room>;
export type UpdateTeamRequest = { team: "red" | "blue" | "spectator" };

export type SendMessageRequest = { content: string; team?: "red" | "blue" };

// Game State Types for WS
export interface GameState {
  room: Room;
  users: (RoomUser & { user: User })[];
  messages: (Message & { username: string })[];
}
