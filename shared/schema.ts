import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema (kept from original)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Camera configurations
export const cameras = pgTable("cameras", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ipAddress: text("ip_address").notNull(),
  rtspPort: integer("rtsp_port").notNull().default(554),
  username: text("username").notNull(),
  password: text("password").notNull(),
  mainStreamPath: text("main_stream_path").notNull(),
  subStreamPath: text("sub_stream_path"),
  isActive: boolean("is_active").notNull().default(true),
  settings: json("settings").$type<{
    brightness: number;
    contrast: number;
    saturation: number;
    nightMode: boolean;
    bwMode: boolean;
    autoExposure: boolean;
  }>().default({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    nightMode: false,
    bwMode: false,
    autoExposure: true
  }),
});

export const insertCameraSchema = createInsertSchema(cameras).pick({
  name: true,
  ipAddress: true,
  rtspPort: true,
  username: true,
  password: true,
  mainStreamPath: true,
  subStreamPath: true,
});

export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof cameras.$inferSelect;

// Camera events for notifications
export const cameraEvents = pgTable("camera_events", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  timestamp: text("timestamp").notNull(),
  notified: boolean("notified").notNull().default(false),
});

export const insertCameraEventSchema = createInsertSchema(cameraEvents).pick({
  cameraId: true,
  eventType: true,
  message: true,
  timestamp: true,
});

export type InsertCameraEvent = z.infer<typeof insertCameraEventSchema>;
export type CameraEvent = typeof cameraEvents.$inferSelect;

// Local notifications 
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"), // info, warning, alert
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  isRead: boolean("is_read").notNull().default(false),
  cameraId: integer("camera_id"),
  screenshotUrl: text("screenshot_url"),
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  title: true,
  message: true,
  type: true,
  cameraId: true,
  screenshotUrl: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;
