import {
  users,
  notifications,
  cameras,
  recordings,
  screenshots,
  userPreferences,
  cameraEvents,
  type User,
  type InsertUser,
  type Notification,
  type InsertNotification,
  type Camera,
  type InsertCamera,
  type Recording,
  type InsertRecording,
  type Screenshot,
  type InsertScreenshot,
  type UserPreferences,
  type InsertUserPreferences,
  type CameraEvent,
  type InsertCameraEvent
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Camera methods
  getCameras(): Promise<Camera[]>;
  getCamera(id: number): Promise<Camera | undefined>;
  getDefaultCamera(): Promise<Camera | undefined>;
  createCamera(camera: InsertCamera): Promise<Camera>;
  updateCamera(id: number, camera: Partial<Camera>): Promise<Camera | undefined>;
  updateCameraSettings(id: number, settings: Camera['settings']): Promise<Camera | undefined>;
  deleteCamera(id: number): Promise<boolean>;

  // Recording methods
  getRecordings(cameraId?: number, limit?: number): Promise<Recording[]>;
  getRecording(id: number): Promise<Recording | undefined>;
  createRecording(recording: InsertRecording): Promise<Recording>;
  deleteRecording(id: number): Promise<boolean>;

  // Screenshot methods
  getScreenshots(cameraId?: number, limit?: number): Promise<Screenshot[]>;
  getScreenshot(id: number): Promise<Screenshot | undefined>;
  createScreenshot(screenshot: InsertScreenshot): Promise<Screenshot>;
  deleteScreenshot(id: number): Promise<boolean>;

  // User Preferences methods
  getUserPreferences(userId: number): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  updateUserPreferences(id: number, preferences: Partial<UserPreferences>): Promise<UserPreferences | undefined>;

  // Camera Event methods
  getCameraEvents(cameraId?: number, limit?: number): Promise<CameraEvent[]>;
  createCameraEvent(event: InsertCameraEvent): Promise<CameraEvent>;

  // Notification methods
  getNotifications(limit?: number): Promise<Notification[]>;
  getUnreadNotificationsCount(): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(): Promise<void>;
  deleteNotification(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private cameras: Map<number, Camera>;
  private recordings: Map<number, Recording>;
  private screenshots: Map<number, Screenshot>;
  private userPreferences: Map<number, UserPreferences>;
  private cameraEvents: Map<number, CameraEvent>;
  private notifications: Map<number, Notification>;

  currentUserId: number;
  currentCameraId: number;
  currentRecordingId: number;
  currentScreenshotId: number;
  currentUserPreferencesId: number;
  currentCameraEventId: number;
  currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.cameras = new Map();
    this.recordings = new Map();
    this.screenshots = new Map();
    this.userPreferences = new Map();
    this.cameraEvents = new Map();
    this.notifications = new Map();

    this.currentUserId = 1;
    this.currentCameraId = 1;
    this.currentRecordingId = 1;
    this.currentScreenshotId = 1;
    this.currentUserPreferencesId = 1;
    this.currentCameraEventId = 1;
    this.currentNotificationId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Camera methods
  async getCameras(): Promise<Camera[]> {
    return Array.from(this.cameras.values());
  }

  async getCamera(id: number): Promise<Camera | undefined> {
    return this.cameras.get(id);
  }

  async getDefaultCamera(): Promise<Camera | undefined> {
    return Array.from(this.cameras.values()).find(
      (camera) => camera.isDefault === true
    );
  }

  async createCamera(insertCamera: InsertCamera): Promise<Camera> {
    const id = this.currentCameraId++;
    const camera: Camera = {
      ...insertCamera,
      id,
      createdAt: new Date(),
      settings: {
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
      }
    };

    // If this is marked as default, remove default from other cameras
    if (camera.isDefault) {
      for (const [cameraId, existingCamera] of this.cameras.entries()) {
        if (existingCamera.isDefault) {
          this.cameras.set(cameraId, { ...existingCamera, isDefault: false });
        }
      }
    }

    this.cameras.set(id, camera);
    return camera;
  }

  async updateCamera(id: number, updateData: Partial<Camera>): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) {
      return undefined;
    }

    // If this camera is being set as default, remove default from other cameras
    if (updateData.isDefault) {
      for (const [cameraId, existingCamera] of this.cameras.entries()) {
        if (cameraId !== id && existingCamera.isDefault) {
          this.cameras.set(cameraId, { ...existingCamera, isDefault: false });
        }
      }
    }

    const updatedCamera = { ...camera, ...updateData };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  async updateCameraSettings(id: number, settings: Camera['settings']): Promise<Camera | undefined> {
    const camera = this.cameras.get(id);
    if (!camera) {
      return undefined;
    }

    const updatedCamera = {
      ...camera,
      settings: { ...camera.settings, ...settings }
    };
    this.cameras.set(id, updatedCamera);
    return updatedCamera;
  }

  async deleteCamera(id: number): Promise<boolean> {
    return this.cameras.delete(id);
  }

  // Recording methods
  async getRecordings(cameraId?: number, limit?: number): Promise<Recording[]> {
    let recordings = Array.from(this.recordings.values());

    // Filter by camera if specified
    if (cameraId) {
      recordings = recordings.filter(recording => recording.cameraId === cameraId);
    }

    // Sort by timestamp (latest first)
    recordings.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit if specified
    if (limit) {
      return recordings.slice(0, limit);
    }

    return recordings;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    return this.recordings.get(id);
  }

  async createRecording(insertRecording: InsertRecording): Promise<Recording> {
    const id = this.currentRecordingId++;
    const recording: Recording = {
      ...insertRecording,
      id,
      createdAt: new Date()
    };
    this.recordings.set(id, recording);
    return recording;
  }

  async deleteRecording(id: number): Promise<boolean> {
    return this.recordings.delete(id);
  }

  // Screenshot methods
  async getScreenshots(cameraId?: number, limit?: number): Promise<Screenshot[]> {
    let screenshots = Array.from(this.screenshots.values());

    // Filter by camera if specified
    if (cameraId) {
      screenshots = screenshots.filter(screenshot => screenshot.cameraId === cameraId);
    }

    // Sort by timestamp (latest first)
    screenshots.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Apply limit if specified
    if (limit) {
      return screenshots.slice(0, limit);
    }

    return screenshots;
  }

  async getScreenshot(id: number): Promise<Screenshot | undefined> {
    return this.screenshots.get(id);
  }

  async createScreenshot(insertScreenshot: InsertScreenshot): Promise<Screenshot> {
    const id = this.currentScreenshotId++;
    const screenshot: Screenshot = {
      ...insertScreenshot,
      id,
      createdAt: new Date()
    };
    this.screenshots.set(id, screenshot);
    return screenshot;
  }

  async deleteScreenshot(id: number): Promise<boolean> {
    return this.screenshots.delete(id);
  }

  // User Preferences methods
  async getUserPreferences(userId: number): Promise<UserPreferences | undefined> {
    // Find preferences for this user
    return Array.from(this.userPreferences.values()).find(
      (prefs) => prefs.userId === userId
    );
  }

  async createUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = this.currentUserPreferencesId++;
    const now = new Date();
    
    const preferences: UserPreferences = {
      ...insertPreferences,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.userPreferences.set(id, preferences);
    return preferences;
  }

  async updateUserPreferences(id: number, updateData: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const preferences = this.userPreferences.get(id);
    if (!preferences) {
      return undefined;
    }

    const updatedPreferences = {
      ...preferences,
      ...updateData,
      updatedAt: new Date()
    };
    
    this.userPreferences.set(id, updatedPreferences);
    return updatedPreferences;
  }

  // Camera Event methods
  async getCameraEvents(cameraId?: number, limit?: number): Promise<CameraEvent[]> {
    let events = Array.from(this.cameraEvents.values());

    // Filter by camera if specified
    if (cameraId) {
      events = events.filter(event => event.cameraId === cameraId);
    }

    // Sort by timestamp (latest first)
    events.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Apply limit if specified
    if (limit) {
      return events.slice(0, limit);
    }

    return events;
  }

  async createCameraEvent(insertEvent: InsertCameraEvent): Promise<CameraEvent> {
    const id = this.currentCameraEventId++;
    const event: CameraEvent = {
      ...insertEvent,
      id,
      timestamp: new Date(),
      notified: false
    };
    this.cameraEvents.set(id, event);
    return event;
  }

  // Notification methods
  async getNotifications(limit?: number): Promise<Notification[]> {
    const notificationArray = Array.from(this.notifications.values());
    // Sort by timestamp (latest first)
    notificationArray.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    if (limit) {
      return notificationArray.slice(0, limit);
    }
    return notificationArray;
  }

  async getUnreadNotificationsCount(): Promise<number> {
    let count = 0;
    for (const notification of this.notifications.values()) {
      if (!notification.isRead) {
        count++;
      }
    }
    return count;
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationId++;
    const notification: Notification = {
      ...insertNotification,
      id,
      timestamp: new Date(),
      isRead: false,
      type: insertNotification.type || "info"
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) {
      return undefined;
    }
    
    const updatedNotification = {
      ...notification,
      isRead: true
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    for (const [id, notification] of this.notifications.entries()) {
      this.notifications.set(id, { ...notification, isRead: true });
    }
  }

  async deleteNotification(id: number): Promise<boolean> {
    return this.notifications.delete(id);
  }
}

export const storage = new MemStorage();
