import React, { useEffect } from "react";
import Header from "@/components/Header";
import CameraViewer from "@/components/CameraViewer";
import ControlsPanel from "@/components/ControlsPanel";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import { NetworkInfoPanel } from "@/components/NetworkInfoPanel";
import { useCameraSettings } from "@/hooks/use-camera-settings";
import { useRtspStream } from "@/hooks/use-rtsp-stream";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

const Home: React.FC = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const queryClient = useQueryClient();
  
  // Setup camera settings state
  const cameraSettings = useCameraSettings();
  
  // Setup RTSP stream connection
  const { 
    connectionStatus, 
    streamUrl,
    isConnecting,
    streamRef,
    reconnectStream
  } = useRtspStream({
    // Default stream URL, can be changed in settings
    url: "rtsp://28167447:Pass2@Pass@192.168.18.10:554/live/ch00_0",
    onError: (error) => {
      toast({
        title: "Stream Error",
        description: error.message,
        variant: "destructive"
      });
      
      // Create a notification for stream error
      createConnectionErrorNotification(error.message);
    }
  });

  // Toggle settings modal
  const handleToggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Send connection status notifications
  useEffect(() => {
    // Only send notifications on connection status changes
    if (connectionStatus === "connected") {
      createConnectionStatusNotification("Camera connection established", "info");
    } else if (connectionStatus === "disconnected") {
      createConnectionStatusNotification("Camera disconnected", "warning");
    }
  }, [connectionStatus]);

  // Create connection status notification
  const createConnectionStatusNotification = async (message: string, type: "info" | "warning" | "alert") => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Camera Status",
          message,
          type,
          cameraId: 1
        }),
      });
      
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  };

  // Create error notification for stream connection issues
  const createConnectionErrorNotification = async (errorMessage: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: "Connection Error",
          message: errorMessage,
          type: "alert",
          cameraId: 1
        }),
      });
      
      // Invalidate notifications queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      console.error("Failed to create error notification:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header 
        connectionStatus={connectionStatus} 
        onSettingsClick={handleToggleSettings}
      />

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-auto p-4 space-y-4">
          <CameraViewer 
            streamRef={streamRef}
            isConnecting={isConnecting}
            streamUrl={streamUrl}
            settings={cameraSettings}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ControlsPanel settings={cameraSettings} />
            <NetworkInfoPanel />
          </div>
        </main>
        
        <Sidebar 
          settings={cameraSettings}
        />
      </div>

      <SettingsModal 
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={cameraSettings}
        streamUrl={streamUrl}
        onReconnect={reconnectStream}
      />
    </div>
  );
};

export default Home;
