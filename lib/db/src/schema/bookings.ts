import { pgTable, text, serial, timestamp, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const bookingsTable = pgTable("bookings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  technicianId: integer("technician_id").notNull(),
  serviceId: integer("service_id"),
  status: text("status").notNull().default("pending"), // pending | accepted | in_progress | completed | cancelled
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
  userLat: doublePrecision("user_lat"),
  userLng: doublePrecision("user_lng"),
  technicianLat: doublePrecision("technician_lat"),
  technicianLng: doublePrecision("technician_lng"),
  totalAmount: doublePrecision("total_amount"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBookingSchema = createInsertSchema(bookingsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBooking = z.infer<typeof insertBookingSchema>;
export type Booking = typeof bookingsTable.$inferSelect;
