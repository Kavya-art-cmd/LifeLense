import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const callsTable = pgTable("calls", {
  id: serial("id").primaryKey(),
  duration: integer("duration"),
  transcript: text("transcript"),
  summary: text("summary"),
  memoriesExtracted: integer("memories_extracted").notNull().default(0),
  decisionsExtracted: integer("decisions_extracted").notNull().default(0),
  status: text("status").notNull().default("completed"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertCallSchema = createInsertSchema(callsTable).omit({ id: true, createdAt: true });
export type InsertCall = z.infer<typeof insertCallSchema>;
export type Call = typeof callsTable.$inferSelect;
