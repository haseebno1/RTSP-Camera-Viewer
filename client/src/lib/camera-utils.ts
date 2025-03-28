import { Camera } from '@shared/schema';

/**
 * Utility functions for camera control and RTSP stream handling
 */

// Parse RTSP URL to get camera information
export function parseRtspUrl(url: string): { 
  username?: string;
  password?: string;
  ip?: string;
  port?: string;
  path?: string;
  host?: string; // Added host field for compatibility with NetworkInfoPanel
} {
  try {
    // Match rtsp://username:password@ip:port/path
    const regex = /rtsp:\/\/(?:([^:]+):([^@]+)@)?([^:\/]+)(?::(\d+))?(?:\/(.*))?/;
    const match = url.match(regex);
    
    if (!match) return {};
    
    return {
      username: match[1],
      password: match[2],
      ip: match[3],
      host: match[3], // Set host equal to IP address
      port: match[4] || "554", // Default RTSP port
      path: match[5]
    };
  } catch (error) {
    console.error('Failed to parse RTSP URL:', error);
    return {};
  }
}

// Generate a masked version of the RTSP URL for display
export function maskRtspUrl(url: string): string {
  return url.replace(/(\w+):([^@]+)@/, "$1:******@");
}

// Generate alternative RTSP URL for different stream qualities
export function getAlternativeStreamUrl(currentUrl: string, quality: 'high' | 'low'): string {
  const parsed = parseRtspUrl(currentUrl);
  
  if (!parsed.ip || !parsed.username || !parsed.password) {
    return currentUrl;
  }
  
  // For V380 Pro, the path format is typically 'live/ch00_0' for high quality
  // and 'live/ch00_1' for low quality
  const streamPath = quality === 'high' ? 'live/ch00_0' : 'live/ch00_1';
  
  return `rtsp://${parsed.username}:${parsed.password}@${parsed.ip}:${parsed.port}/${streamPath}`;
}

// Check if RTSP URL is valid
export function isValidRtspUrl(url: string): boolean {
  const regex = /^rtsp:\/\/(?:[^:]+:[^@]+@)?[^:\/]+(?::\d+)?(?:\/.*)?$/;
  return regex.test(url);
}

// Generate camera settings object for API calls
export interface CameraApiSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  nightMode: boolean;
  bwMode: boolean;
  autoExposure: boolean;
  viewMode?: string;
  dewarpEnabled?: boolean;
  streamQuality?: string;
  renderingQuality?: string;
}

export function generateCameraApiSettings(
  brightness: number,
  contrast: number,
  saturation: number,
  nightMode: boolean,
  bwMode: boolean,
  autoExposure: boolean,
  viewMode?: string,
  dewarpEnabled?: boolean,
  streamQuality?: string,
  renderingQuality?: string
): CameraApiSettings {
  return {
    brightness,
    contrast,
    saturation,
    nightMode,
    bwMode,
    autoExposure,
    viewMode,
    dewarpEnabled,
    streamQuality,
    renderingQuality
  };
}

// Create a new camera object
export function createCameraObject(name: string, rtspUrl: string, isDefault: boolean = false) {
  return {
    name,
    rtspUrl,
    isDefault,
    isActive: true
  };
}

// Extract IP and port from a camera
export function getCameraNetworkInfo(camera: Camera) {
  const parsed = parseRtspUrl(camera.rtspUrl);
  return {
    ip: parsed.ip || '',
    port: parseInt(parsed.port || '554'),
    username: parsed.username || '',
    host: parsed.host || ''
  };
}

// Get screenshot filename based on camera and timestamp
export function getScreenshotFilename(cameraId: number, extension: string = 'jpg') {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `camera_${cameraId}_${timestamp}.${extension}`;
}

// Get recording filename based on camera and timestamp
export function getRecordingFilename(cameraId: number, extension: string = 'mp4') {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '');
  return `recording_${cameraId}_${timestamp}.${extension}`;
}

// Format file size for display
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const parts = [];
  if (hrs > 0) parts.push(`${hrs}h`);
  if (mins > 0) parts.push(`${mins}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
}
