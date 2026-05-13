import { pgTable, text, serial, timestamp, boolean, doublePrecision, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const techniciansTable = pgTable("technicians", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  bio: text("bio"),
  skills: text("skills").array().notNull().default([]),
  experienceYears: integer("experience_years").notNull().default(0),
  hourlyRate: doublePrecision("hourly_rate").notNull().default(0),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
  isAvailable: boolean("is_available").notNull().default(true),
  rating: doublePrecision("rating").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  isVerified: boolean("is_verified").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  serviceRadius: integer("service_radius").notNull().default(50),
  profileImage: text("profile_image"),
  phone: text("phone"),
  email: text("email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTechnicianSchema = createInsertSchema(techniciansTable).omit({ id: true, createdAt: true, updatedAt: true, rating: true, ratingCount: true });
export type InsertTechnician = z.infer<typeof insertTechnicianSchema>;
export type Technician = typeof techniciansTable.$inferSelect;
