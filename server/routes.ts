import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupRtspStream, disconnectStream } from "./lib/rtsp-stream";
import { sendSlackMessage } from "./lib/slack";

export async function registerRoutes(app: Express): Promise<Server> {
  // RTSP Stream API Routes
  app.post('/api/stream/connect', async (req, res) => {
    try {
      const { rtspUrl } = req.body;
      
      if (!rtspUrl) {
        return res.status(400).json({ message: 'RTSP URL is required' });
      }
      
      const wsUrl = await setupRtspStream(rtspUrl);
      res.json({ wsUrl });
    } catch (error) {
      console.error('Error connecting to RTSP stream:', error);
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
  
  // Slack Notification API Route
  app.post('/api/slack/notify', async (req, res) => {
    try {
      const { message, cameraStatus } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message content is required' });
      }
      
      // Get the Slack channel ID from environment variables
      const channelId = process.env.SLACK_CHANNEL_ID;
      
      if (!channelId) {
        return res.status(500).json({ message: 'Slack channel ID is not configured' });
      }
      
      // Send message to Slack
      await sendSlackMessage({
        channel: channelId,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '*V380 Pro Camera Notification*'
            }
          },
          {
            type: 'section',
            text: {
              type: 'plain_text',
              text: message
            }
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `*Status:* ${cameraStatus || 'Unknown'}`
              }
            ]
          }
        ]
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error sending Slack notification:', error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : 'Failed to send Slack notification' 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
