import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupRtspStream, disconnectStream } from "./lib/rtsp-stream";
import { insertNotificationSchema, insertCameraSchema, insertScreenshotSchema, insertRecordingSchema } from "@shared/schema";
import { z } from "zod";
import { getIpAddress } from "./lib/network-utils";
import { runNetworkDiagnostics, getConnectionSuggestions } from "./lib/network-diagnostics";
import path from "path";
import fs from "fs";
import { maskRtspUrl } from "../client/src/lib/camera-utils";

// Create uploads directory structure if it doesn't exist
const uploadDirs = ['uploads', 'uploads/recordings', 'uploads/screenshots'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Camera management API Routes
  app.get('/api/cameras', async (req, res) => {
    try {
      const cameras = await storage.getCameras();
      res.json(cameras);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch cameras' 
      });
    }
  });

  app.get('/api/cameras/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const camera = await storage.getCamera(id);
      
      if (!camera) {
        return res.status(404).json({ message: 'Camera not found' });
      }
      
      res.json(camera);
    } catch (error) {
      console.error('Error fetching camera:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch camera' 
      });
    }
  });

  app.get('/api/cameras/default', async (req, res) => {
    try {
      const camera = await storage.getDefaultCamera();
      
      if (!camera) {
        return res.status(404).json({ message: 'No default camera found' });
      }
      
      res.json(camera);
    } catch (error) {
      console.error('Error fetching default camera:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch default camera' 
      });
    }
  });

  app.post('/api/cameras', async (req, res) => {
    try {
      // Validate camera data
      const validatedData = insertCameraSchema.parse(req.body);
      
      // Create the camera
      const camera = await storage.createCamera(validatedData);
      
      // Create a notification for the new camera
      await storage.createNotification({
        title: "Camera Added",
        message: `Added new camera: ${camera.name}`,
        type: "info"
      });
      
      res.status(201).json(camera);
    } catch (error) {
      console.error('Error creating camera:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid camera data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create camera' 
      });
    }
  });

  app.patch('/api/cameras/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      
      // Update the camera
      const camera = await storage.updateCamera(id, updateData);
      
      if (!camera) {
        return res.status(404).json({ message: 'Camera not found' });
      }
      
      // Create a notification for the camera update
      await storage.createNotification({
        title: "Camera Updated",
        message: `Updated camera: ${camera.name}`,
        type: "info",
        cameraId: camera.id
      });
      
      res.json(camera);
    } catch (error) {
      console.error('Error updating camera:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to update camera' 
      });
    }
  });

  app.patch('/api/cameras/:id/settings', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const settings = req.body;
      
      // Update the camera settings
      const camera = await storage.updateCameraSettings(id, settings);
      
      if (!camera) {
        return res.status(404).json({ message: 'Camera not found' });
      }
      
      // Create a notification for the settings update
      await storage.createNotification({
        title: "Camera Settings Updated",
        message: `Updated settings for camera: ${camera.name}`,
        type: "info",
        cameraId: camera.id
      });
      
      res.json(camera);
    } catch (error) {
      console.error('Error updating camera settings:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to update camera settings' 
      });
    }
  });

  app.delete('/api/cameras/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Get the camera before deleting it
      const camera = await storage.getCamera(id);
      
      if (!camera) {
        return res.status(404).json({ message: 'Camera not found' });
      }
      
      // Delete the camera
      const success = await storage.deleteCamera(id);
      
      if (!success) {
        return res.status(500).json({ message: 'Failed to delete camera' });
      }
      
      // Create a notification for the camera deletion
      await storage.createNotification({
        title: "Camera Deleted",
        message: `Deleted camera: ${camera.name}`,
        type: "info"
      });
      
      res.json({ success });
    } catch (error) {
      console.error('Error deleting camera:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to delete camera' 
      });
    }
  });

  // Screenshot API Routes
  app.get('/api/screenshots', async (req, res) => {
    try {
      const cameraId = req.query.cameraId ? parseInt(req.query.cameraId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const screenshots = await storage.getScreenshots(cameraId, limit);
      res.json(screenshots);
    } catch (error) {
      console.error('Error fetching screenshots:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch screenshots' 
      });
    }
  });

  app.post('/api/screenshots', async (req, res) => {
    try {
      const validatedData = insertScreenshotSchema.parse(req.body);
      const screenshot = await storage.createScreenshot(validatedData);
      
      // Create a notification for the new screenshot
      await storage.createNotification({
        title: "Screenshot Captured",
        message: `New screenshot captured from camera ID: ${screenshot.cameraId}`,
        type: "info",
        cameraId: screenshot.cameraId,
        screenshotUrl: screenshot.filePath
      });
      
      res.status(201).json(screenshot);
    } catch (error) {
      console.error('Error creating screenshot:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid screenshot data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create screenshot' 
      });
    }
  });

  // Recordings API Routes
  app.get('/api/recordings', async (req, res) => {
    try {
      const cameraId = req.query.cameraId ? parseInt(req.query.cameraId as string) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const recordings = await storage.getRecordings(cameraId, limit);
      res.json(recordings);
    } catch (error) {
      console.error('Error fetching recordings:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch recordings' 
      });
    }
  });

  app.post('/api/recordings', async (req, res) => {
    try {
      const validatedData = insertRecordingSchema.parse(req.body);
      const recording = await storage.createRecording(validatedData);
      
      // Create a notification for the new recording
      await storage.createNotification({
        title: "Recording Saved",
        message: `New recording saved from camera ID: ${recording.cameraId} (${recording.duration}s)`,
        type: "info",
        cameraId: recording.cameraId
      });
      
      res.status(201).json(recording);
    } catch (error) {
      console.error('Error creating recording:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: 'Invalid recording data', 
          errors: error.errors 
        });
      }
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create recording' 
      });
    }
  });

  // RTSP Stream API Routes
  app.post('/api/stream/connect', async (req, res) => {
    try {
      const { rtspUrl, cameraId } = req.body;
      
      if (!rtspUrl) {
        return res.status(400).json({ message: 'RTSP URL is required' });
      }
      
      const wsUrl = await setupRtspStream(rtspUrl);
      
      // Create a notification for stream connection
      await storage.createNotification({
        title: "Camera Stream Connected",
        message: `Successfully connected to camera stream: ${maskRtspUrl(rtspUrl)}`,
        type: "info",
        cameraId: cameraId || null,
      });
      
      res.json({ wsUrl });
    } catch (error) {
      console.error('Error connecting to RTSP stream:', error);
      
      // Create an error notification
      await storage.createNotification({
        title: "Camera Stream Connection Failed",
        message: error instanceof Error ? error.message : 'Failed to connect to RTSP stream',
        type: "alert",
        cameraId: req.body.cameraId || null,
      });
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to connect to RTSP stream' 
      });
    }
  });
  
  app.post('/api/stream/disconnect', async (req, res) => {
    try {
      const { rtspUrl, cameraId } = req.body;
      
      if (!rtspUrl) {
        return res.status(400).json({ message: 'RTSP URL is required' });
      }
      
      await disconnectStream(rtspUrl);
      
      // Create a notification for stream disconnection
      await storage.createNotification({
        title: "Camera Stream Disconnected",
        message: `Disconnected from camera stream: ${maskRtspUrl(rtspUrl)}`,
        type: "info",
        cameraId: cameraId || null,
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
  app.post('/api/camera/settings', async (req, res) => {
    try {
      const { 
        brightness, 
        contrast, 
        saturation, 
        nightMode, 
        bwMode, 
        autoExposure,
        cameraId 
      } = req.body;
      
      // In a real implementation, these settings would be sent to the camera
      // using its specific API protocol. For now, we just echo back the settings.
      
      // Create a notification for settings change
      await storage.createNotification({
        title: "Camera Settings Updated",
        message: `Updated camera settings: ${
          Object.entries({brightness, contrast, saturation, nightMode, bwMode, autoExposure})
            .filter(([_, val]) => val !== undefined)
            .map(([key, val]) => `${key}: ${val}`)
            .join(', ')
        }`,
        type: "info",
        cameraId: cameraId || null,
      });
      
      // If cameraId is provided, update camera settings in storage
      if (cameraId) {
        const settings = {
          brightness, 
          contrast, 
          saturation, 
          nightMode, 
          bwMode, 
          autoExposure
        };
        
        // Filter out undefined values
        Object.keys(settings).forEach(key => {
          if (settings[key as keyof typeof settings] === undefined) {
            delete settings[key as keyof typeof settings];
          }
        });
        
        await storage.updateCameraSettings(cameraId, settings);
      }
      
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

  // User Preferences API Routes
  app.get('/api/preferences/:userId', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await storage.getUserPreferences(userId);
      
      if (!preferences) {
        return res.status(404).json({ message: 'Preferences not found for this user' });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to fetch user preferences' 
      });
    }
  });

  app.post('/api/preferences', async (req, res) => {
    try {
      const preferences = await storage.createUserPreferences(req.body);
      res.status(201).json(preferences);
    } catch (error) {
      console.error('Error creating user preferences:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create user preferences' 
      });
    }
  });

  app.patch('/api/preferences/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const preferences = await storage.updateUserPreferences(id, req.body);
      
      if (!preferences) {
        return res.status(404).json({ message: 'Preferences not found' });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error('Error updating user preferences:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to update user preferences' 
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
  
  // Test notification API Route
  app.post('/api/notifications/test', async (req, res) => {
    try {
      const { message, cameraId } = req.body;
      
      const notification = await storage.createNotification({
        title: "Test Notification",
        message: message || "This is a test notification from your camera system",
        type: "info",
        cameraId: cameraId || null,
      });
      
      res.json({ success: true, notification });
    } catch (error) {
      console.error('Error creating test notification:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to create test notification' 
      });
    }
  });
  
  // Network information API endpoint
  app.get('/api/network/info', (req, res) => {
    try {
      const ipAddress = getIpAddress();
      const hostname = req.hostname;
      const port = process.env.PORT || 5000;
      
      res.json({
        success: true,
        network: {
          ipAddress,
          hostname,
          port,
          wsUrl: `ws://${ipAddress}:${port}`,
          httpUrl: `http://${ipAddress}:${port}`
        }
      });
    } catch (error) {
      console.error('Error getting network information:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to get network information' 
      });
    }
  });
  
  // Network diagnostics API endpoint
  app.post('/api/network/diagnostics', async (req, res) => {
    try {
      const { cameraIp, rtspPort, cameraId } = req.body;
      
      if (!cameraIp) {
        return res.status(400).json({ message: 'Camera IP is required' });
      }
      
      // Run network diagnostics
      const diagnostics = await runNetworkDiagnostics(cameraIp, rtspPort || 554);
      
      // Generate suggestions based on diagnostics
      const suggestions = getConnectionSuggestions(diagnostics, cameraIp);
      
      // Create a notification with the diagnostics result
      await storage.createNotification({
        title: "Network Diagnostics Completed",
        message: `Diagnostics for camera at ${cameraIp}: ${diagnostics.status === 'success' ? 'Success' : 
                  diagnostics.status === 'partial' ? 'Partial connectivity' : 'Connection failed'}`,
        type: diagnostics.status === 'success' ? 'info' : 
              diagnostics.status === 'partial' ? 'warning' : 'alert',
        cameraId: cameraId || null,
      });
      
      res.json({
        success: true,
        diagnostics,
        suggestions
      });
    } catch (error) {
      console.error('Error running network diagnostics:', error);
      
      // Create an error notification
      await storage.createNotification({
        title: "Network Diagnostics Failed",
        message: error instanceof Error ? error.message : 'Failed to run network diagnostics',
        type: "alert",
        cameraId: req.body.cameraId || null,
      });
      
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to run network diagnostics' 
      });
    }
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  const httpServer = createServer(app);

  return httpServer;
}
