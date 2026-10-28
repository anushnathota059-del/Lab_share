import { createInsertSchema } from "drizzle-zod";
import { date, integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { z } from "zod/v4";
import { equipmentTable } from "./equipment";

export const bookingsTable = pgTable("labshare_bookings", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id")
    .notNull()
    .references(() => equipmentTable.id),
  studentName: text("student_name").notNull(),
  studentEmail: text("student_email").notNull(),
  demoKey: text("demo_key"),
  projectPurpose: text("project_purpose").notNull(),
  requestedDate: date("requested_date", { mode: "string" }).notNull(),
  requestedTime: text("requested_time").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({
  id: true,
  createdAt: true,
  status: true,
  demoKey: true,
});

export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type BookingRecord = typeof bookingsTable.$inferSelect;
