import { useState } from 'react';
import { Check, ChevronRight, CameraIcon, WifiIcon, Settings2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { isValidRtspUrl } from '@/lib/camera-utils';
import { apiRequest, queryClient } from '@/lib/queryClient';

type OnboardingStep = 'welcome' | 'camera-setup' | 'network-info' | 'complete';

interface OnboardingWizardProps {
  onComplete: () => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [cameraName, setCameraName] = useState('My V380 Camera');
  const [rtspUrl, setRtspUrl] = useState('rtsp://username:password@192.168.1.100:554/live/ch00_0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'camera-setup', 'network-info', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'camera-setup', 'network-info', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleSaveCamera = async () => {
    if (!isValidRtspUrl(rtspUrl)) {
      toast({
        variant: "destructive",
        title: "Invalid RTSP URL",
        description: "Please enter a valid RTSP URL in the format: rtsp://username:password@ip:port/path",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest({
        url: '/api/cameras',
        method: 'POST',
        body: {
          name: cameraName,
          rtspUrl: rtspUrl,
          isDefault: true
        }
      });

      toast({
        title: "Camera Added",
        description: "Your camera has been successfully added",
      });

      // Invalidate cameras cache
      queryClient.invalidateQueries({ queryKey: ['/api/cameras'] });
      
      // Move to next step
      handleNext();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to add camera",
        description: "An error occurred while adding your camera. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  // Welcome step
  if (step === 'welcome') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <CameraIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Welcome to FishEye RTSP Viewer</CardTitle>
          <CardDescription>
            This wizard will guide you through setting up your V380 Pro IP Camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Multi-Camera Support</h3>
              <p className="text-sm text-muted-foreground">
                Connect and manage multiple IP cameras at once
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Dewarping Support</h3>
              <p className="text-sm text-muted-foreground">
                Correct fisheye lens distortion for clearer viewing
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">VR Mode & Recording</h3>
              <p className="text-sm text-muted-foreground">
                View in VR mode and record footage directly from your browser
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleNext}>
            Get Started <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Camera setup step
  if (step === 'camera-setup') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Settings2 className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Camera Setup</CardTitle>
          <CardDescription>
            Enter your camera information to connect to your device.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="camera-name">Camera Name</Label>
            <Input 
              id="camera-name" 
              value={cameraName} 
              onChange={(e) => setCameraName(e.target.value)} 
              placeholder="My Living Room Camera"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rtsp-url">RTSP URL</Label>
            <Input
              id="rtsp-url"
              value={rtspUrl}
              onChange={(e) => setRtspUrl(e.target.value)}
              placeholder="rtsp://username:password@192.168.1.100:554/live/ch00_0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              For V380 Pro cameras, the format is typically:
              <code className="block mt-1 p-1 bg-muted rounded">
                rtsp://username:password@ip-address:554/live/ch00_0
              </code>
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleSaveCamera} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Camera"}
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Network info step
  if (step === 'network-info') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <WifiIcon className="h-8 w-8 text-primary" />
          </div>
          <CardTitle>Network Information</CardTitle>
          <CardDescription>
            Important details about connectivity between your device and camera.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3">
            <h3 className="text-sm font-medium">Connection Tips</h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Ensure your camera and device are on the same network</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Check that port 554 is not blocked by your firewall</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="h-3 w-3 text-primary" />
                </div>
                <span>Use the Network Diagnostics tool if you have connection issues</span>
              </li>
            </ul>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg">
            <h3 className="text-sm font-medium mb-2">Common Issues</h3>
            <p className="text-sm text-muted-foreground">
              If you encounter connection problems, check the following:
            </p>
            <ul className="text-sm text-muted-foreground list-disc pl-5 mt-2 space-y-1">
              <li>Camera username and password are correct</li>
              <li>Camera IP address is accessible from your device</li>
              <li>Camera is powered on and properly connected to the network</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button onClick={handleNext}>
            Continue
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Complete step
  if (step === 'complete') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle>Setup Complete!</CardTitle>
          <CardDescription>
            You're all set up and ready to use the FishEye RTSP Viewer.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            Your camera has been added and is ready to view. You can add more cameras or configure additional settings from the main dashboard.
          </p>
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <HelpCircle className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-medium">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Use the Network Diagnostics tool in the settings panel if you encounter any connection issues.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleComplete}>
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return null;
}