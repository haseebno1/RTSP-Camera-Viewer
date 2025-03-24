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
  rtspUrl: text("rtsp_url").notNull(),
  isDefault: boolean("is_default").default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  settings: json("settings").$type<{
    brightness: number;
    contrast: number;
    saturation: number;
    nightMode: boolean;
    bwMode: boolean;
    autoExposure: boolean;
    viewMode: string;
    dewarpEnabled: boolean;
    streamQuality: string;
    renderingQuality: string;
  }>().default({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    nightMode: false,
    bwMode: false,
    autoExposure: true,
    viewMode: "360",
    dewarpEnabled: true,
    streamQuality: "high",
    renderingQuality: "balanced"
  }),
});

export const insertCameraSchema = createInsertSchema(cameras).pick({
  name: true,
  rtspUrl: true,
  isDefault: true,
  isActive: true,
});

export type InsertCamera = z.infer<typeof insertCameraSchema>;
export type Camera = typeof cameras.$inferSelect;

// Recordings for camera footage
export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  duration: integer("duration").notNull(), // in seconds
  fileSize: integer("file_size").notNull(), // in bytes
  thumbnailUrl: text("thumbnail_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: json("metadata").$type<{
    resolution: string;
    format: string;
    fps: number;
    hasAudio: boolean;
    viewMode: string;
  }>(),
});

export const insertRecordingSchema = createInsertSchema(recordings).pick({
  cameraId: true,
  fileName: true,
  filePath: true,
  duration: true,
  fileSize: true,
  thumbnailUrl: true,
  metadata: true,
});

export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type Recording = typeof recordings.$inferSelect;

// Screenshots from camera feeds
export const screenshots = pgTable("screenshots", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  fileName: text("file_name").notNull(),
  filePath: text("file_path").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  createdAt: timestamp("created_at").notNull().defaultNow(),
  metadata: json("metadata").$type<{
    resolution: string;
    format: string;
    viewMode: string;
  }>(),
});

export const insertScreenshotSchema = createInsertSchema(screenshots).pick({
  cameraId: true,
  fileName: true,
  filePath: true,
  fileSize: true,
  metadata: true,
});

export type InsertScreenshot = z.infer<typeof insertScreenshotSchema>;
export type Screenshot = typeof screenshots.$inferSelect;

// User preferences for settings
export const userPreferences = pgTable("user_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  theme: text("theme").notNull().default("dark"),
  language: text("language").notNull().default("en"),
  enableNotifications: boolean("enable_notifications").notNull().default(true),
  defaultViewMode: text("default_view_mode").notNull().default("360"),
  defaultCamera: integer("default_camera"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).pick({
  userId: true,
  theme: true,
  language: true,
  enableNotifications: true,
  defaultViewMode: true,
  defaultCamera: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Camera events for notifications
export const cameraEvents = pgTable("camera_events", {
  id: serial("id").primaryKey(),
  cameraId: integer("camera_id").notNull(),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  screenshotId: integer("screenshot_id"),
  notified: boolean("notified").notNull().default(false),
});

export const insertCameraEventSchema = createInsertSchema(cameraEvents).pick({
  cameraId: true,
  eventType: true,
  message: true,
  screenshotId: true,
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
