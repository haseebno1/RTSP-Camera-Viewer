import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { CameraSettings } from "@/hooks/use-camera-settings";
import { setupThreeJsScene, updateScene } from "@/lib/three-utils";

interface CameraViewerProps {
  streamRef: React.RefObject<HTMLVideoElement>;
  isConnecting: boolean;
  streamUrl: string;
  settings: CameraSettings;
}

const CameraViewer: React.FC<CameraViewerProps> = ({ 
  streamRef, 
  isConnecting, 
  streamUrl,
  settings 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Initialize Three.js scene and handle updates
  useEffect(() => {
    if (containerRef.current && canvasRef.current && streamRef.current) {
      // Initialize scene
      sceneRef.current = setupThreeJsScene(
        canvasRef.current,
        streamRef.current,
        containerRef.current,
        settings.isDewarpEnabled
      );
      
      // Update on resize
      const handleResize = () => {
        if (sceneRef.current && containerRef.current) {
          sceneRef.current.handleResize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      };
      
      window.addEventListener('resize', handleResize);
      
      // Animation loop
      let frameId: number;
      const animate = () => {
        frameId = requestAnimationFrame(animate);
        if (sceneRef.current) {
          sceneRef.current.render();
        }
      };
      animate();
      
      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(frameId);
        if (sceneRef.current) {
          sceneRef.current.dispose();
        }
      };
    }
  }, [streamRef]);

  // Update scene when settings change
  useEffect(() => {
    if (sceneRef.current) {
      updateScene(sceneRef.current, settings);
    }
  }, [
    settings.isDewarpEnabled,
    settings.brightness,
    settings.contrast,
    settings.saturation,
    settings.isNightModeEnabled,
    settings.isBWModeEnabled,
    settings.viewMode
  ]);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Monitor fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Handle zoom
  const handleZoomIn = () => {
    if (sceneRef.current) {
      sceneRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (sceneRef.current) {
      sceneRef.current.zoomOut();
    }
  };

  return (
    <div 
      ref={containerRef} 
      className="camera-feed relative aspect-video rounded-lg shadow-xl bg-gray-900 border border-gray-800 w-full max-h-[calc(100vh-12rem)] overflow-hidden"
    >
      {/* Hidden video element for the stream */}
      <video 
        ref={streamRef} 
        autoPlay 
        playsInline 
        muted 
        className="hidden" 
      />
      
      {/* Canvas for Three.js rendering */}
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
      
      {/* Loading state */}
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-center p-8">
            <div className="inline-block mb-3">
              <span className="material-icons animate-spin text-4xl text-primary">cached</span>
            </div>
            <p>Connecting to camera stream...</p>
            <p className="text-gray-400 text-sm mt-2">
              {streamUrl.replace(/(\w+):([^@]+)@/, "$1:******@")}
            </p>
          </div>
        </div>
      )}
      
      {/* Camera view navigation controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 rounded-b-lg flex items-center justify-between backdrop-blur-md bg-gray-900/70">
        <div className="flex space-x-3">
          {/* View mode selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-1.5 text-sm">
                <span className="material-icons text-lg">view_in_ar</span>
                <span>
                  {settings.viewMode === "360" && "360° View"}
                  {settings.viewMode === "180" && "180° View"}
                  {settings.viewMode === "quad" && "Quad View"}
                  {settings.viewMode === "vr" && "VR View"}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => settings.setViewMode("360")}>
                360° Panoramic
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => settings.setViewMode("180")}>
                180° Half-Panorama
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => settings.setViewMode("quad")}>
                Quadrant Split View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => settings.setViewMode("vr")}>
                VR Side-by-Side
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Dewarp toggle */}
          <div className="flex items-center space-x-2">
            <Label htmlFor="dewarp-toggle" className="text-sm text-gray-300">
              Dewarp
            </Label>
            <Switch
              id="dewarp-toggle"
              checked={settings.isDewarpEnabled}
              onCheckedChange={settings.toggleDewarp}
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          {/* Zoom controls */}
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-5 w-5" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-5 w-5" />
          </Button>
          
          {/* Fullscreen toggle */}
          <Button variant="outline" size="icon" onClick={toggleFullscreen}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CameraViewer;
