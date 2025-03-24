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
}

export function generateCameraApiSettings(
  brightness: number,
  contrast: number,
  saturation: number,
  nightMode: boolean,
  bwMode: boolean,
  autoExposure: boolean
): CameraApiSettings {
  return {
    brightness,
    contrast,
    saturation,
    nightMode,
    bwMode,
    autoExposure
  };
}
