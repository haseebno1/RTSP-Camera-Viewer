import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Network, Wifi, WifiOff, RotateCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface NetworkConnectionGuideProps {
  serverIp: string;
  cameraIp: string;
}

export function NetworkConnectionGuide({ serverIp, cameraIp }: NetworkConnectionGuideProps) {
  const [networkChecked, setNetworkChecked] = useState(false);
  const [sameNetwork, setSameNetwork] = useState(false);
  
  // Function to check if server and camera are on the same network
  const checkNetwork = () => {
    // Get the first 2 parts of the IP addresses to check if they're on the same subnet
    // This works for most home networks (e.g. 192.168.1.x)
    const serverNetworkParts = serverIp.split('.');
    const cameraNetworkParts = cameraIp.split('.');
    
    const serverNetwork = `${serverNetworkParts[0]}.${serverNetworkParts[1]}`;
    const cameraNetwork = `${cameraNetworkParts[0]}.${cameraNetworkParts[1]}`;
    
    // Set the state based on network comparison - we're comparing just the first two octets
    // This handles the case where subnets might have different third octets but still be routable
    setNetworkChecked(true);
    setSameNetwork(serverNetwork === cameraNetwork);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Network className="w-4 h-4 mr-2" />
          Network Connection Guide
        </CardTitle>
        <CardDescription>
          Use this guide to configure your network for connecting to your camera
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Network Check */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">Check Network Configuration</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={checkNetwork}
              className="flex items-center gap-1"
            >
              <RotateCw className="h-3 w-3" /> Check
            </Button>
          </div>
          
          {networkChecked && (
            <Alert variant={sameNetwork ? "default" : "destructive"} className="mt-2">
              <div className="flex items-center gap-2">
                {sameNetwork ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <WifiOff className="h-4 w-4" />
                )}
                <AlertTitle>
                  {sameNetwork 
                    ? "Devices are on the same network" 
                    : "Devices are on different networks"}
                </AlertTitle>
              </div>
              <AlertDescription className="mt-2">
                {sameNetwork 
                  ? `Your server (${serverIp}) and camera (${cameraIp}) are on the same network.` 
                  : `Your server (${serverIp}) and camera (${cameraIp}) are on different networks. Connection may not be possible without additional configuration.`}
              </AlertDescription>
            </Alert>
          )}
        </div>
        
        {/* Connection Solutions */}
        {networkChecked && !sameNetwork && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="option-1">
              <AccordionTrigger>Option 1: Connect to the camera's network</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>Connect your device to the same network as your camera:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Find the network that your camera is connected to (typically a WiFi network)</li>
                    <li>Connect your device to that same network</li>
                    <li>Refresh this page and try connecting again</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="option-2">
              <AccordionTrigger>Option 2: Connect camera to your network</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>Connect your camera to the same network as this device:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Use your camera's mobile app to configure WiFi settings</li>
                    <li>Select the same WiFi network that this device is connected to</li>
                    <li>Enter the WiFi password when prompted</li>
                    <li>Wait for the camera to connect (typically 1-2 minutes)</li>
                    <li>Find the new IP address assigned to your camera using your router's admin panel</li>
                    <li>Update the RTSP URL with the new IP address</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="option-3">
              <AccordionTrigger>Option 3: Configure port forwarding</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 text-sm">
                  <p>Set up port forwarding on your router to allow access to the camera:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Access your router's admin panel (typically at 192.168.1.1 or 192.168.0.1)</li>
                    <li>Find the port forwarding section (sometimes under Advanced Settings)</li>
                    <li>Create a new port forwarding rule for your camera:</li>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Internal IP: {cameraIp}</li>
                      <li>Internal Port: 554 (RTSP default)</li>
                      <li>External Port: 554</li>
                      <li>Protocol: TCP/UDP</li>
                    </ul>
                    <li>Save the settings and restart your router if required</li>
                    <li>Update the RTSP URL to use your router's public IP address</li>
                  </ol>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      
      {networkChecked && sameNetwork && (
        <CardFooter className="border-t pt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">Connection should be possible!</p>
            <p>If you still can't connect, check if any firewalls are blocking the connection or if the camera requires specific credentials.</p>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}