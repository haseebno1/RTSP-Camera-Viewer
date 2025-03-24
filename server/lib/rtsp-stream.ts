import { spawn } from 'child_process';
import WebSocket from 'ws';
import { createServer } from 'http';

// Store active RTSP streams
interface StreamInfo {
  ffmpegProcess: any;
  wsServer: WebSocket.Server;
  clients: Set<WebSocket>;
  lastClientDisconnectTimeout?: NodeJS.Timeout;
}

const activeStreams = new Map<string, StreamInfo>();

/**
 * Setup an RTSP stream and serve it over WebSocket
 * @param rtspUrl The RTSP URL to stream
 * @returns WebSocket URL to connect to
 */
export async function setupRtspStream(rtspUrl: string): Promise<string> {
  // Generate a unique stream ID based on the RTSP URL
  const streamId = Buffer.from(rtspUrl).toString('base64');
  
  // Check if stream already exists
  if (activeStreams.has(streamId)) {
    // Clear any disconnect timeout
    const stream = activeStreams.get(streamId)!;
    if (stream.lastClientDisconnectTimeout) {
      clearTimeout(stream.lastClientDisconnectTimeout);
      stream.lastClientDisconnectTimeout = undefined;
    }
    
    // Return existing WebSocket URL
    return `ws://localhost:${getPortForStream(streamId)}`;
  }
  
  // Get a random port between 10000 and 20000
  const port = Math.floor(Math.random() * 10000) + 10000;
  
  // Create HTTP server
  const server = createServer();
  
  // Create WebSocket server
  const wsServer = new WebSocket.Server({ server });
  
  // Start HTTP server
  await new Promise<void>((resolve, reject) => {
    server.listen(port, () => {
      resolve();
    });
    server.on('error', (err) => {
      reject(err);
    });
  });
  
  // Store clients for this stream
  const clients = new Set<WebSocket>();
  
  // Setup FFmpeg process to convert RTSP to MPEG-TS
  const ffmpegArgs = [
    '-i', rtspUrl,
    '-f', 'mpegts',
    '-codec:v', 'mpeg1video',
    '-s', '640x480', // Adjust resolution as needed
    '-b:v', '1000k', // Adjust bitrate as needed
    '-r', '30', // Frames per second
    '-bf', '0', // No B-frames for lower latency
    '-q:v', '3', // Quality (1-31, where 1 is best)
    '-codec:a', 'mp2', // Audio codec
    '-ar', '44100', // Audio sample rate
    '-ac', '1', // Audio channels
    '-b:a', '128k', // Audio bitrate
    '-muxdelay', '0.001', // Low muxing delay
    'pipe:1' // Output to stdout
  ];
  
  // Spawn FFmpeg process
  const ffmpegProcess = spawn('ffmpeg', ffmpegArgs, {
    shell: false
  });
  
  // Handle FFmpeg errors
  ffmpegProcess.stderr.on('data', (data: Buffer) => {
    console.log(`FFmpeg: ${data.toString()}`);
  });
  
  // Handle FFmpeg exit
  ffmpegProcess.on('close', (code: number) => {
    console.log(`FFmpeg process exited with code ${code}`);
    
    // Clean up
    wsServer.close();
    server.close();
    activeStreams.delete(streamId);
  });
  
  // WebSocket connection handler
  wsServer.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Add client to set
    clients.add(ws);
    
    // Handle client disconnect
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
      
      // If no clients left, schedule cleanup
      if (clients.size === 0) {
        const stream = activeStreams.get(streamId);
        if (stream) {
          stream.lastClientDisconnectTimeout = setTimeout(() => {
            console.log('No clients left, cleaning up stream');
            disconnectStream(rtspUrl).catch(console.error);
          }, 60000); // Give 1 minute before cleanup
        }
      }
    });
  });
  
  // Handle FFmpeg output and send to WebSocket clients
  ffmpegProcess.stdout.on('data', (data: Buffer) => {
    // Send data to all connected clients
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
  
  // Store stream info
  activeStreams.set(streamId, {
    ffmpegProcess,
    wsServer,
    clients
  });
  
  // Store port for this stream
  setPortForStream(streamId, port);
  
  // Return WebSocket URL
  return `ws://localhost:${port}`;
}

/**
 * Disconnect an RTSP stream
 * @param rtspUrl The RTSP URL to disconnect
 */
export async function disconnectStream(rtspUrl: string): Promise<void> {
  const streamId = Buffer.from(rtspUrl).toString('base64');
  
  // Get stream info
  const stream = activeStreams.get(streamId);
  if (!stream) {
    return;
  }
  
  // Kill FFmpeg process
  if (stream.ffmpegProcess) {
    stream.ffmpegProcess.kill('SIGKILL');
  }
  
  // Close WebSocket connections
  stream.clients.forEach((client) => {
    client.close();
  });
  
  // Close WebSocket server
  stream.wsServer.close();
  
  // Remove from active streams
  activeStreams.delete(streamId);
  
  // Clear port mapping
  clearPortForStream(streamId);
}

// Simple in-memory port storage
const streamPorts = new Map<string, number>();

function getPortForStream(streamId: string): number {
  return streamPorts.get(streamId) || 0;
}

function setPortForStream(streamId: string, port: number): void {
  streamPorts.set(streamId, port);
}

function clearPortForStream(streamId: string): void {
  streamPorts.delete(streamId);
}
