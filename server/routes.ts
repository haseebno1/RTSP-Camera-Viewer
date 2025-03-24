import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupRtspStream, disconnectStream } from "./lib/rtsp-stream";
import { insertNotificationSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // RTSP Stream API Routes
  app.post('/api/stream/connect', async (req, res) => {
    try {
      const { rtspUrl } = req.body;
      
      if (!rtspUrl) {
        return res.status(400).json({ message: 'RTSP URL is required' });
      }
      
      const wsUrl = await setupRtspStream(rtspUrl);
      
      // Create a notification for stream connection
      await storage.createNotification({
        title: "Camera Stream Connected",
        message: `Successfully connected to camera stream: ${rtspUrl.replace(/(\w+):([^@]+)@/, "$1:******@")}`,
        type: "info",
        cameraId: 1, // Default camera ID
      });
      
      res.json({ wsUrl });
    } catch (error) {
      console.error('Error connecting to RTSP stream:', error);
      
      // Create an error notification
      await storage.createNotification({
        title: "Camera Stream Connection Failed",
        message: error instanceof Error ? error.message : 'Failed to connect to RTSP stream',
        type: "alert",
        cameraId: 1, // Default camera ID
      });
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to connect to RTSP stream' 
      });
    }
  });
  
  app.post('/api/stream/disconnect', async (req, res) => {
    try {
      const { rtspUrl } = req.body;
      
      if (!rtspUrl) {
        return res.status(400).json({ message: 'RTSP URL is required' });
      }
      
      await disconnectStream(rtspUrl);
      
      // Create a notification for stream disconnection
      await storage.createNotification({
        title: "Camera Stream Disconnected",
        message: `Disconnected from camera stream: ${rtspUrl.replace(/(\w+):([^@]+)@/, "$1:******@")}`,
        type: "info",
        cameraId: 1, // Default camera ID
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error disconnecting from RTSP stream:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to disconnect from RTSP stream' 
      });
    }
  });
  
  // Camera Settings API Route - for adjusting camera parameters
  app.post('/api/camera/settings', (req, res) => {
    try {
      const { 
        brightness, 
        contrast, 
        saturation, 
        nightMode, 
        bwMode, 
        autoExposure 
      } = req.body;
      
      // In a real implementation, these settings would be sent to the camera
      // using its specific API protocol. For now, we just echo back the settings.
      
      // Create a notification for settings change
      storage.createNotification({
        title: "Camera Settings Updated",
        message: `Updated camera settings: ${
          Object.entries({brightness, contrast, saturation, nightMode, bwMode, autoExposure})
            .filter(([_, val]) => val !== undefined)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ')
        }`,
        type: "info",
        cameraId: 1, // Default camera ID
      });
      
      res.json({ 
        success: true,
        settings: {
          brightness, 
          contrast, 
          saturation, 
          nightMode, 
          bwMode, 
          autoExposure 
        }
      });
    } catch (error) {
      console.error('Error updating camera settings:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to update camera settings' 
      });
    }
  });
  
  // Notifications API Routes
  app.get('/api/notifications', async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const notifications = await storage.getNotifications(limit);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch notifications' 
      });
    }
  });
  
  app.get('/api/notifications/unread/count', async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount();
      res.json({ count });
    } catch (error) {
      console.error('Error counting unread notifications:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to count unread notifications' 
      });
    }
  });
  
  app.post('/api/notifications', async (req, res) => {
    try {
      const validatedData = insertNotificationSchema.parse(req.body);
      const notification = await storage.createNotification(validatedData);
      res.status(201).json(notification);
    } catch (error) {
      console.error('Error creating notification:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid notification data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create notification' 
      });
    }
  });
  
  app.patch('/api/notifications/:id/read', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const notification = await storage.markNotificationAsRead(id);
      
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to mark notification as read' 
      });
    }
  });
  
  app.patch('/api/notifications/read-all', async (req, res) => {
    try {
      await storage.markAllNotificationsAsRead();
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to mark all notifications as read' 
      });
    }
  });
  
  app.delete('/api/notifications/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteNotification(id);
      
      if (!success) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      
      res.json({ success });
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to delete notification' 
      });
    }
  });
  
  // Test notification API Route (replacing Slack)
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { message } = req.body;
      
      const notification = await storage.createNotification({
        title: "Test Notification",
        message: message || "This is a test notification from your camera system",
        type: "info",
        cameraId: 1, // Default camera ID
      });
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create test notification' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
