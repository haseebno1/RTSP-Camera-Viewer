import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { CameraSettings } from "@/hooks/use-camera-settings";
import { Bell, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";

interface SidebarProps {
  settings: CameraSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ settings }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const queryClient = useQueryClient();

  const handleNotificationsToggle = (checked: boolean) => {
    setNotificationsEnabled(checked);
  };

  const handleSendTestNotification = async () => {
    try {
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: "This is a test notification sent from the camera viewer." 
        }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread/count'] });
    } catch (error) {
      console.error('Failed to send test notification:', error);
    }
  };

  return (
    <aside className="hidden lg:block w-72 bg-gray-800 border-l border-gray-700 p-4 overflow-y-auto">
      <div className="space-y-6">
        {/* View Presets Section */}
        <section>
          <h3 className="text-sm font-semibold uppercase text-gray-400 mb-3">View Presets</h3>
          <div className="flex flex-col space-y-2">
            <Button 
              variant={settings.viewMode === "360" ? "default" : "outline"} 
              className="w-full justify-between" 
              onClick={() => settings.setViewMode("360")}
            >
              <span>360° Panoramic</span>
              {settings.viewMode === "360" && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button 
              variant={settings.viewMode === "180" ? "default" : "outline"} 
              className="w-full justify-between" 
              onClick={() => settings.setViewMode("180")}
            >
              <span>180° Half-Panorama</span>
              {settings.viewMode === "180" && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button 
              variant={settings.viewMode === "quad" ? "default" : "outline"} 
              className="w-full justify-between" 
              onClick={() => settings.setViewMode("quad")}
            >
              <span>Quadrant Split View</span>
              {settings.viewMode === "quad" && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button 
              variant={settings.viewMode === "vr" ? "default" : "outline"} 
              className="w-full justify-between" 
              onClick={() => settings.setViewMode("vr")}
            >
              <span>VR Side-by-Side</span>
              {settings.viewMode === "vr" && (
                <CheckCircle className="h-4 w-4 text-primary" />
              )}
            </Button>
          </div>
        </section>
        
        {/* Camera Information */}
        <section>
          <h3 className="text-sm font-semibold uppercase text-gray-400 mb-3">Camera Info</h3>
          <div className="bg-gray-900 rounded-md p-3 text-sm">
            <div className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-2">
              <span className="text-gray-400">IP Address:</span>
              <span className="font-mono">192.168.18.10</span>
              
              <span className="text-gray-400">RTSP Port:</span>
              <span className="font-mono">554</span>
              
              <span className="text-gray-400">Status:</span>
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                Streaming
              </span>
              
              <span className="text-gray-400">Stream Type:</span>
              <span>{settings.streamQuality === "high" ? "Main Stream (HD)" : "Sub Stream (SD)"}</span>
            </div>
          </div>
        </section>
        
        {/* Local Notifications */}
        <section>
          <h3 className="text-sm font-semibold uppercase text-gray-400 mb-3">Notifications</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Camera Notifications</span>
              <Switch
                id="notifications-toggle"
                checked={notificationsEnabled}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>
            <Button 
              className="w-full"
              variant="default"
              onClick={handleSendTestNotification}
              disabled={!notificationsEnabled}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Test Notification
            </Button>
          </div>
        </section>
      </div>
    </aside>
  );
};

export default Sidebar;
