import { useState, useRef, useEffect } from "react";

interface UseRtspStreamProps {
  url: string;
  onError?: (error: Error) => void;
}

interface UseRtspStreamReturn {
  connectionStatus: "connected" | "connecting" | "disconnected";
  streamUrl: string;
  isConnecting: boolean;
  streamRef: React.RefObject<HTMLVideoElement>;
  reconnectStream: (newUrl?: string) => void;
}

export function useRtspStream({ url, onError }: UseRtspStreamProps): UseRtspStreamReturn {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "connecting" | "disconnected">("connecting");
  const [streamUrl, setStreamUrl] = useState(url);
  const [isConnecting, setIsConnecting] = useState(true);
  const streamRef = useRef<HTMLVideoElement>(null);
  
  // Setup and connect to stream
  const connectToStream = async (url: string) => {
    try {
      setIsConnecting(true);
      setConnectionStatus("connecting");
      
      // Get websocket URL for RTSP stream
      const response = await fetch('/api/stream/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rtspUrl: url }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to connect to stream');
      }
      
      const data = await response.json();
      const wsUrl = data.wsUrl;
      
      if (streamRef.current) {
        // Initialize JSMpeg player with the WebSocket URL
        const playerScript = document.createElement('script');
        playerScript.src = 'https://cdn.jsdelivr.net/npm/jsmpeg@0.1/jsmpeg.min.js';
        playerScript.onload = () => {
          // @ts-ignore - JSMpeg is loaded via script tag
          if (window.JSMpeg && streamRef.current) {
            // @ts-ignore
            new window.JSMpeg.Player(wsUrl, {
              canvas: document.createElement('canvas'), // Hidden canvas
              videoBufferSize: 1024 * 1024, // 1MB buffer for video
              audio: false, // No audio
              onPlay: () => {
                setIsConnecting(false);
                setConnectionStatus("connected");
              },
              onStalled: () => {
                setConnectionStatus("disconnected");
              }
            });
          }
        };
        document.head.appendChild(playerScript);
      }
    } catch (error) {
      setConnectionStatus("disconnected");
      setIsConnecting(false);
      if (onError && error instanceof Error) {
        onError(error);
      }
      console.error('Error connecting to RTSP stream:', error);
    }
  };
  
  // Connect to stream on component mount
  useEffect(() => {
    connectToStream(url);
    
    return () => {
      // Cleanup
      fetch('/api/stream/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rtspUrl: streamUrl }),
      }).catch(console.error);
    };
  }, []);
  
  // Reconnect to stream with possibly new URL
  const reconnectStream = (newUrl?: string) => {
    const urlToUse = newUrl || streamUrl;
    if (newUrl) {
      setStreamUrl(newUrl);
    }
    
    // Disconnect current stream first
    fetch('/api/stream/disconnect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rtspUrl: streamUrl }),
    })
    .then(() => {
      connectToStream(urlToUse);
    })
    .catch((error) => {
      console.error('Error disconnecting from stream:', error);
      // Try to connect anyway
      connectToStream(urlToUse);
    });
  };
  
  return {
    connectionStatus,
    streamUrl,
    isConnecting,
    streamRef,
    reconnectStream
  };
}
