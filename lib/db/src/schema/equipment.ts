import { createInsertSchema } from "drizzle-zod";
import { jsonb, pgTable, serial, text } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const equipmentTable = pgTable("labshare_equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  availability: text("availability").notNull().default("available"),
  imageUrl: text("image_url").notNull().default(""),
  rules: jsonb("rules").$type<string[]>().notNull().default([]),
  eligibility: jsonb("eligibility").$type<string[]>().notNull().default([]),
});

export const insertEquipmentSchema = createInsertSchema(equipmentTable).omit({
  id: true,
});

export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type EquipmentRecord = typeof equipmentTable.$inferSelect;
