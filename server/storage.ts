import { users, notifications, type User, type InsertUser, type Notification, type InsertNotification } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
  private notifications: Map<number, Notification>;
  currentUserId: number;
  currentNotificationId: number;

  constructor() {
    this.users = new Map();
    this.notifications = new Map();
    this.currentUserId = 1;
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
      isRead: false
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
