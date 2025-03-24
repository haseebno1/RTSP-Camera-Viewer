import React, { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronsUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { CameraSettings } from "@/hooks/use-camera-settings";

interface ControlsPanelProps {
  settings: CameraSettings;
}

const ControlsPanel: React.FC<ControlsPanelProps> = ({ settings }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="border-b border-gray-700 px-4 py-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base font-medium">Camera Controls</CardTitle>
          <CollapsibleTrigger className="text-gray-400 hover:text-white">
            <ChevronsUpDown className="h-5 w-5" />
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Brightness Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="brightness" className="text-sm font-medium">Brightness</Label>
                  <span className="text-sm text-gray-400">{settings.brightness.toFixed(1)}</span>
                </div>
                <Slider
                  id="brightness"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={[settings.brightness]}
                  onValueChange={(value) => settings.setBrightness(value[0])}
                />
              </div>
              
              {/* Contrast Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="contrast" className="text-sm font-medium">Contrast</Label>
                  <span className="text-sm text-gray-400">{settings.contrast.toFixed(1)}</span>
                </div>
                <Slider
                  id="contrast"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={[settings.contrast]}
                  onValueChange={(value) => settings.setContrast(value[0])}
                />
              </div>
              
              {/* Saturation Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="saturation" className="text-sm font-medium">Saturation</Label>
                  <span className="text-sm text-gray-400">{settings.saturation.toFixed(1)}</span>
                </div>
                <Slider
                  id="saturation"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={[settings.saturation]}
                  onValueChange={(value) => settings.setSaturation(value[0])}
                />
              </div>
              
              {/* Night Mode Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="night-mode" className="text-sm font-medium">Night Mode</Label>
                <Switch
                  id="night-mode"
                  checked={settings.isNightModeEnabled}
                  onCheckedChange={settings.toggleNightMode}
                />
              </div>
              
              {/* Black & White Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="bw-mode" className="text-sm font-medium">Black & White</Label>
                <Switch
                  id="bw-mode"
                  checked={settings.isBWModeEnabled}
                  onCheckedChange={settings.toggleBWMode}
                />
              </div>
              
              {/* Auto Exposure Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-exposure" className="text-sm font-medium">Auto Exposure</Label>
                <Switch
                  id="auto-exposure"
                  checked={settings.isAutoExposureEnabled}
                  onCheckedChange={settings.toggleAutoExposure}
                />
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default ControlsPanel;
