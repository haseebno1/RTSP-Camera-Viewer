import React from "react";
import Header from "@/components/Header";
import CameraViewer from "@/components/CameraViewer";
import ControlsPanel from "@/components/ControlsPanel";
import Sidebar from "@/components/Sidebar";
import SettingsModal from "@/components/SettingsModal";
import { useCameraSettings } from "@/hooks/use-camera-settings";
import { useRtspStream } from "@/hooks/use-rtsp-stream";
import { useToast } from "@/hooks/use-toast";

const Home: React.FC = () => {
  const { toast } = useToast();
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  
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
    }
  });

  // Toggle settings modal
  const handleToggleSettings = () => {
    setSettingsOpen(!settingsOpen);
  };

  // Handle sending test notification to Slack
  const handleSendTestNotification = async () => {
    try {
      const response = await fetch('/api/slack/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: "Test notification from V380 Pro Fisheye Camera Viewer",
          cameraStatus: connectionStatus
        })
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent to Slack",
        });
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Failed to send notification');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to send notification',
        variant: "destructive"
      });
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
          
          <ControlsPanel settings={cameraSettings} />
        </main>
        
        <Sidebar 
          settings={cameraSettings}
          onSendTestNotification={handleSendTestNotification}
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
