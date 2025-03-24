import React from "react";
import { Button } from "@/components/ui/button";
import { Settings, Camera } from "lucide-react";
import NotificationCenter from "./NotificationCenter";

interface HeaderProps {
  connectionStatus: "connected" | "connecting" | "disconnected";
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ connectionStatus, onSettingsClick }) => {
  return (
    <header className="bg-gray-800 border-b border-gray-700 py-3 px-4 flex justify-between items-center">
      <div className="flex items-center space-x-3">
        <Camera className="h-5 w-5 text-primary" />
        <h1 className="text-lg font-semibold">V380 Pro Fisheye Viewer</h1>
      </div>
      <div className="flex items-center space-x-3">
        {/* Status indicator */}
        <div className="flex items-center space-x-1.5">
          <div 
            className={`h-2 w-2 rounded-full ${
              connectionStatus === "connected" 
                ? "bg-green-500" 
                : connectionStatus === "connecting" 
                  ? "bg-yellow-500" 
                  : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-300">
            {connectionStatus === "connected" 
              ? "Connected" 
              : connectionStatus === "connecting" 
                ? "Connecting" 
                : "Disconnected"}
          </span>
        </div>
        
        {/* Notification Center */}
        <NotificationCenter />
        
        {/* Settings Button */}
        <Button variant="ghost" size="icon" onClick={onSettingsClick} aria-label="Settings">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Header;
