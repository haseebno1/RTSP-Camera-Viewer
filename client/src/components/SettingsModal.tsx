import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CopyIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CameraSettings } from "@/hooks/use-camera-settings";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CameraSettings;
  streamUrl: string;
  onReconnect: (url: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  settings,
  streamUrl,
  onReconnect
}) => {
  const { toast } = useToast();
  const [currentUrl, setCurrentUrl] = React.useState(streamUrl);
  
  // Reset to defaults
  const handleResetSettings = () => {
    settings.resetToDefaults();
    toast({
      title: "Settings Reset",
      description: "Camera settings have been reset to default values",
    });
  };
  
  // Copy URL to clipboard
  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast({
        title: "Copied",
        description: "Stream URL copied to clipboard",
      });
    }).catch((err) => {
      toast({
        title: "Failed to copy",
        description: "Could not copy URL to clipboard",
        variant: "destructive"
      });
    });
  };
  
  // Apply changes and reconnect if needed
  const handleApplyChanges = () => {
    // If URL changed, reconnect
    if (currentUrl !== streamUrl) {
      onReconnect(currentUrl);
    }
    onClose();
    
    toast({
      title: "Settings Applied",
      description: "Your changes have been applied successfully",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-800 text-white border-gray-700 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Camera Settings</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rtsp-url">RTSP Stream URL</Label>
            <div className="flex">
              <Input
                id="rtsp-url"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                className="flex-1 bg-gray-900 border-gray-700 font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                className="ml-2"
                onClick={handleCopyUrl}
                title="Copy URL"
              >
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stream-quality">Stream Quality</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={settings.streamQuality === "high" ? "default" : "outline"}
                onClick={() => settings.setStreamQuality("high")}
              >
                Main Stream (HD)
              </Button>
              <Button
                variant={settings.streamQuality === "low" ? "default" : "outline"}
                onClick={() => settings.setStreamQuality("low")}
              >
                Sub Stream (SD)
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rendering-performance">Rendering Performance</Label>
            <Select 
              onValueChange={(value) => settings.setRenderingQuality(value as "high" | "balanced" | "performance")} 
              defaultValue={settings.renderingQuality}
            >
              <SelectTrigger className="w-full bg-gray-900 border-gray-700">
                <SelectValue placeholder="Select rendering quality" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-700">
                <SelectItem value="high">High Quality (GPU intensive)</SelectItem>
                <SelectItem value="balanced">Balanced</SelectItem>
                <SelectItem value="performance">Performance (Low CPU/GPU usage)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between border-t border-gray-700 pt-4 gap-3">
          <Button
            variant="outline"
            onClick={handleResetSettings}
          >
            Reset Defaults
          </Button>
          <Button
            onClick={handleApplyChanges}
          >
            Apply Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsModal;
