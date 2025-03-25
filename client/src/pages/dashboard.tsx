import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertCircle, Camera, Layers, Settings, Video, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useRtspStream } from '@/hooks/use-rtsp-stream';
import { useCameraSettings } from '@/hooks/use-camera-settings';
import { CameraViewer } from '@/components/CameraViewer';
import { ControlsPanel } from '@/components/ControlsPanel';
import { SettingsModal } from '@/components/SettingsModal';
import { NetworkInfoPanel } from '@/components/NetworkInfoPanel';
import { NetworkDiagnostics } from '@/components/NetworkDiagnostics';
import { CameraList } from '@/components/CameraList';
import { getAlternativeStreamUrl, getScreenshotFilename, getRecordingFilename } from '@/lib/camera-utils';
import { Camera as CameraType } from '@shared/schema';

export default function Dashboard() {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState('live');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingStartTime, setRecordingStartTime] = useState<Date | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const settings = useCameraSettings();

  // Fetch default camera
  const { data: defaultCamera, isLoading: isLoadingCamera } = useQuery({
    queryKey: ['/api/cameras/default'],
    queryFn: () => apiRequest({ url: '/api/cameras/default' }),
    onError: () => {}
  });

  // If no default camera, try to get all cameras
  const { data: cameras = [] } = useQuery({
    queryKey: ['/api/cameras'],
    queryFn: () => apiRequest({ url: '/api/cameras' }),
    enabled: !defaultCamera,
    onError: () => {}
  });

  // State for current camera
  const [currentCamera, setCurrentCamera] = useState<CameraType | null>(null);

  // Set current camera when data is loaded
  useEffect(() => {
    if (defaultCamera) {
      setCurrentCamera(defaultCamera);
    } else if (cameras.length > 0) {
      setCurrentCamera(cameras[0]);
    }
  }, [defaultCamera, cameras]);

  // Get stream URL based on quality setting
  const streamUrl = currentCamera ? (
    settings.streamQuality === 'high' 
      ? currentCamera.rtspUrl 
      : getAlternativeStreamUrl(currentCamera.rtspUrl, 'low')
  ) : '';

  // Connect to RTSP stream
  const { 
    streamRef, 
    isConnecting, 
    connectionStatus,
    streamUrl: wsStreamUrl,
    reconnectStream
  } = useRtspStream({ 
    url: streamUrl,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Stream Connection Error",
        description: error.message,
      });
    }
  });

  // Handle camera selection
  const handleSelectCamera = (camera: CameraType) => {
    setCurrentCamera(camera);
    // Apply camera settings if available
    if (camera.settings) {
      settings.setBrightness(camera.settings.brightness || 0);
      settings.setContrast(camera.settings.contrast || 0);
      settings.setSaturation(camera.settings.saturation || 0);
      if (camera.settings.nightMode !== undefined) settings.toggleNightMode();
      if (camera.settings.bwMode !== undefined) settings.toggleBWMode();
      if (camera.settings.autoExposure !== undefined) settings.toggleAutoExposure();
      if (camera.settings.viewMode) settings.setViewMode(camera.settings.viewMode as any);
      if (camera.settings.dewarpEnabled !== undefined && camera.settings.dewarpEnabled !== settings.isDewarpEnabled) {
        settings.toggleDewarp();
      }
      if (camera.settings.streamQuality) settings.setStreamQuality(camera.settings.streamQuality as any);
      if (camera.settings.renderingQuality) settings.setRenderingQuality(camera.settings.renderingQuality as any);
    }
    reconnectStream(camera.rtspUrl);
  };

  // Take screenshot
  const handleTakeScreenshot = async () => {
    if (!streamRef.current || !currentCamera) return;

    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      canvas.width = streamRef.current.videoWidth;
      canvas.height = streamRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      // Draw the current video frame to the canvas
      ctx.drawImage(streamRef.current, 0, 0, canvas.width, canvas.height);

      // Convert the canvas to a blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(blob => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to create blob from canvas'));
        }, 'image/jpeg', 0.95);
      });

      // Create a file from the blob
      const filename = getScreenshotFilename(currentCamera.id);
      const file = new File([blob], filename, { type: 'image/jpeg' });

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('cameraId', currentCamera.id.toString());

      // Create a temporary URL for preview
      const screenshotUrl = URL.createObjectURL(blob);

      // Save to backend
      const response = await fetch('/api/screenshots', {
        method: 'POST',
        body: JSON.stringify({
          cameraId: currentCamera.id,
          fileName: filename,
          filePath: `/uploads/screenshots/${filename}`,
          fileSize: blob.size,
          metadata: {
            resolution: `${canvas.width}x${canvas.height}`,
            format: 'jpeg',
            viewMode: settings.viewMode
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to save screenshot');

      // Show success message with preview
      toast({
        title: "Screenshot Captured",
        description: (
          <div className="mt-2">
            <img 
              src={screenshotUrl} 
              alt="Screenshot" 
              className="rounded-md max-h-48 mb-2" 
            />
            <p className="text-xs text-muted-foreground">
              Resolution: {canvas.width}x{canvas.height}
            </p>
          </div>
        ),
      });

      // Invalidate screenshots query
      queryClient.invalidateQueries({ queryKey: ['/api/screenshots'] });

    } catch (error) {
      toast({
        variant: "destructive",
        title: "Screenshot Failed",
        description: error instanceof Error ? error.message : "Failed to capture screenshot",
      });
    }
  };

  // Start recording
  const handleStartRecording = () => {
    if (!streamRef.current || !currentCamera) return;

    try {
      const stream = streamRef.current.captureStream();
      const options = { mimeType: 'video/webm;codecs=vp9' };
      
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      recordedChunks.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunks.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = handleStopRecording;
      
      mediaRecorderRef.current.start(1000); // Collect 1 second chunks
      setIsRecording(true);
      setRecordingStartTime(new Date());
      
      toast({
        title: "Recording Started",
        description: "Recording video from the camera stream",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Recording Failed",
        description: error instanceof Error ? error.message : "Failed to start recording",
      });
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (!mediaRecorderRef.current || !currentCamera || !recordingStartTime) return;
    
    try {
      // If recording is active, stop it
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      
      setIsRecording(false);
      
      // Calculate recording duration
      const endTime = new Date();
      const durationInSeconds = Math.round((endTime.getTime() - recordingStartTime.getTime()) / 1000);
      
      // Create a blob from the recorded chunks
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      
      // Create filename
      const filename = getRecordingFilename(currentCamera.id, 'webm');
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      document.body.appendChild(a);
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      
      // Save to backend
      const response = await fetch('/api/recordings', {
        method: 'POST',
        body: JSON.stringify({
          cameraId: currentCamera.id,
          fileName: filename,
          filePath: `/uploads/recordings/${filename}`,
          duration: durationInSeconds,
          fileSize: blob.size,
          metadata: {
            resolution: `${streamRef.current?.videoWidth}x${streamRef.current?.videoHeight}`,
            format: 'webm',
            fps: 30,
            hasAudio: false,
            viewMode: settings.viewMode
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to save recording');
      
      // Trigger download
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      recordedChunks.current = [];
      
      // Show success message
      toast({
        title: "Recording Saved",
        description: `Recorded ${durationInSeconds} seconds of video`,
      });
      
      // Invalidate recordings query
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Save Recording Failed",
        description: error instanceof Error ? error.message : "Failed to save recording",
      });
    }
  };

  // Format elapsed recording time
  const formatElapsedTime = () => {
    if (!recordingStartTime) return '00:00';
    
    const elapsedMs = new Date().getTime() - recordingStartTime.getTime();
    const elapsedSec = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(elapsedSec / 60);
    const seconds = elapsedSec % 60;
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update recording timer
  const [elapsedTime, setElapsedTime] = useState('00:00');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setElapsedTime(formatElapsedTime());
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, recordingStartTime]);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Fisheye RTSP Web Viewer</h1>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </Button>
          </div>
        </div>

        {!currentCamera && !isLoadingCamera && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No camera configured</AlertTitle>
            <AlertDescription>
              Please add a camera to get started.
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="live" className="flex items-center">
              <Video className="h-4 w-4 mr-2" />
              Live View
            </TabsTrigger>
            <TabsTrigger value="cameras" className="flex items-center">
              <Layers className="h-4 w-4 mr-2" />
              Cameras
            </TabsTrigger>
            <TabsTrigger value="network" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Network
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="space-y-4">
            {currentCamera && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div className="lg:col-span-3">
                    {/* Camera Viewer */}
                    <div className="relative rounded-lg overflow-hidden bg-black">
                      <CameraViewer 
                        streamRef={streamRef}
                        isConnecting={isConnecting}
                        streamUrl={wsStreamUrl}
                        settings={settings}
                      />
                      
                      {/* Recording indicator */}
                      {isRecording && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full flex items-center space-x-2 animate-pulse">
                          <span className="h-2 w-2 bg-white rounded-full"></span>
                          <span className="text-sm font-medium">REC {elapsedTime}</span>
                        </div>
                      )}
                      
                      {/* Camera info overlay */}
                      <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1 rounded text-sm">
                        {currentCamera.name} • {settings.viewMode} View • {connectionStatus === 'connected' ? 'Connected' : 'Connecting...'}
                      </div>
                    </div>

                    {/* Camera Controls */}
                    <div className="flex flex-wrap justify-between items-center mt-4 gap-2">
                      <div>
                        <h2 className="text-lg font-semibold">{currentCamera.name}</h2>
                        <p className="text-sm text-muted-foreground">
                          {settings.viewMode} view • {settings.streamQuality} quality
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          onClick={handleTakeScreenshot}
                          disabled={connectionStatus !== 'connected'}
                          variant="secondary"
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Screenshot
                        </Button>
                        
                        {!isRecording ? (
                          <Button 
                            onClick={handleStartRecording}
                            disabled={connectionStatus !== 'connected'}
                            variant="secondary"
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            <Video className="h-4 w-4 mr-2" />
                            Record
                          </Button>
                        ) : (
                          <Button 
                            onClick={handleStopRecording}
                            variant="secondary"
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <span className="mr-2">■</span>
                            Stop ({elapsedTime})
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <Card className="h-full">
                      <CardContent className="p-4">
                        <ControlsPanel settings={settings} />
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="recordings">
                    <AccordionTrigger>Recordings & Screenshots</AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-medium text-lg mb-2">Recent Recordings</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Manage your camera recordings
                            </p>
                            <Button variant="outline" className="w-full" onClick={() => setCurrentTab('recordings')}>
                              View Recordings
                            </Button>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <h3 className="font-medium text-lg mb-2">Screenshots</h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              Browse captured screenshots
                            </p>
                            <Button variant="outline" className="w-full" onClick={() => setCurrentTab('screenshots')}>
                              View Screenshots
                            </Button>
                          </CardContent>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </>
            )}

            {!currentCamera && !isLoadingCamera && (
              <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg">
                <Video className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-medium mb-2">No Camera Configured</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add a camera to start viewing the live feed.
                </p>
                <Button onClick={() => setCurrentTab('cameras')}>
                  Configure Cameras
                </Button>
              </div>
            )}

            {isLoadingCamera && (
              <div className="flex justify-center items-center p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="cameras">
            <CameraList onSelectCamera={handleSelectCamera} />
          </TabsContent>

          <TabsContent value="network">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-4">Network Information</h3>
                  <NetworkInfoPanel />
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium text-lg mb-4">Network Diagnostics</h3>
                  <NetworkDiagnostics 
                    currentCameraIp={currentCamera ? currentCamera.rtspUrl.split('@')[1]?.split(':')[0] || '' : ''}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        streamUrl={streamUrl}
        onReconnect={(url) => {
          reconnectStream(url);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}