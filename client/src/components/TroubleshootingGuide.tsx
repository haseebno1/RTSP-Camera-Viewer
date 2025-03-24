import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NetworkDiagnostics } from './NetworkDiagnostics';
import { HelpCircle, WifiOff, AlertTriangle, Settings, Camera, Network } from 'lucide-react';

interface TroubleshootingGuideProps {
  currentCameraIp: string;
}

export function TroubleshootingGuide({ currentCameraIp }: TroubleshootingGuideProps) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Camera Connection Troubleshooting
        </CardTitle>
        <CardDescription>
          Guide to help resolve camera connection issues
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="network">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="network">
              <Network className="h-4 w-4 mr-2" />
              Network
            </TabsTrigger>
            <TabsTrigger value="camera">
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="tools">
              <Settings className="h-4 w-4 mr-2" />
              Tools
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="network" className="mt-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Network Connectivity Issues</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="different-networks">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <WifiOff className="h-4 w-4 text-red-500" />
                      Camera and Server on Different Networks
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      Your camera (IP: {currentCameraIp}) appears to be on a different network than this application server.
                      This is a common issue when using cloud-based environments like Replit.
                    </p>
                    
                    <h4 className="font-medium mt-3">Solutions:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        <strong>Local Deployment:</strong> Deploy this application on a device (like a Raspberry Pi or PC) 
                        that's on the same network as your camera.
                      </li>
                      <li>
                        <strong>Network Bridge:</strong> Use a VPN or tunneling solution to bridge the networks.
                      </li>
                      <li>
                        <strong>Camera Reconfiguration:</strong> If your camera supports it, configure it to 
                        stream to an RTSP relay service that this application can access.
                      </li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="firewall">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Firewall or Router Blocking Connection
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      Even if your camera and server are on the same network, firewall settings or router configurations
                      might block RTSP traffic.
                    </p>
                    
                    <h4 className="font-medium mt-3">Checklist:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Ensure RTSP port (usually 554) is not blocked by firewalls.</li>
                      <li>Check if your router has any traffic filtering rules that might affect RTSP.</li>
                      <li>Some ISPs block common streaming ports - contact your provider if needed.</li>
                      <li>Try temporarily disabling firewalls to test connectivity (enable again after testing).</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="nat">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-blue-500" />
                      NAT/Port Forwarding Issues
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      If accessing your camera from outside your local network, you'll need proper port forwarding.
                    </p>
                    
                    <h4 className="font-medium mt-3">Configuration Steps:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Access your router's admin interface (typically 192.168.1.1 or 192.168.0.1).</li>
                      <li>Find the port forwarding section (may be under "Advanced" or "NAT").</li>
                      <li>Add a new rule for your camera's IP ({currentCameraIp}) forwarding external and internal port 554.</li>
                      <li>Save settings and restart your router if needed.</li>
                      <li>Test using your external IP (use a site like "What is my IP").</li>
                      <li>Consider using a dynamic DNS service if your external IP changes frequently.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <NetworkDiagnostics currentCameraIp={currentCameraIp} />
            </div>
          </TabsContent>
          
          <TabsContent value="camera" className="mt-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Camera Configuration Issues</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="credentials">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Incorrect Credentials
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      One of the most common issues is incorrect username or password in the RTSP URL.
                    </p>
                    
                    <h4 className="font-medium mt-3">Checklist:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Verify the username and password for your camera.</li>
                      <li>Ensure special characters are properly URL-encoded.</li>
                      <li>
                        RTSP URL format should be:
                        <code className="block bg-muted p-2 my-1 rounded text-xs">
                          rtsp://username:password@camera-ip:port/live/ch00_0
                        </code>
                      </li>
                      <li>For V380 Pro cameras, try both main and sub streams:</li>
                      <ul className="list-disc pl-5 space-y-1">
                        <li>Main: <code>rtsp://username:password@camera-ip:554/live/ch00_0</code></li>
                        <li>Sub: <code>rtsp://username:password@camera-ip:554/live/ch00_1</code></li>
                      </ul>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="rtsp-disabled">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      RTSP Not Enabled on Camera
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      Some cameras require RTSP to be explicitly enabled in their settings.
                    </p>
                    
                    <h4 className="font-medium mt-3">Configuration Steps:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Access your camera's web interface or mobile app.</li>
                      <li>Navigate to Advanced Settings or Network Configuration.</li>
                      <li>Look for "RTSP Service" or "Stream Settings".</li>
                      <li>Enable RTSP streaming and save settings.</li>
                      <li>Note down the RTSP URL format provided by your camera.</li>
                      <li>For V380 Pro, use the mobile app to enable RTSP in advanced settings.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="wrong-path">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-purple-500" />
                      Incorrect RTSP Stream Path
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      Different camera models use different path formats for their RTSP streams.
                    </p>
                    
                    <h4 className="font-medium mt-3">Common V380 Pro Path Formats:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Main Stream: <code>/live/ch00_0</code> or <code>/h264/ch1/main/av_stream</code></li>
                      <li>Sub Stream: <code>/live/ch00_1</code> or <code>/h264/ch1/sub/av_stream</code></li>
                    </ul>
                    
                    <h4 className="font-medium mt-3">Troubleshooting:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Check your camera's documentation for the correct RTSP path.</li>
                      <li>Try different common path formats used by your camera brand.</li>
                      <li>Some cameras provide the path in their web interface or mobile app.</li>
                      <li>Use a tool like VLC to test different RTSP URL variants.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
          
          <TabsContent value="tools" className="mt-4 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Troubleshooting Tools</h3>
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="test-rtsp">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Camera className="h-4 w-4 text-green-500" />
                      Testing RTSP Stream with VLC
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      VLC is a great tool for testing RTSP streams before using them in this application.
                    </p>
                    
                    <h4 className="font-medium mt-3">Steps to test with VLC:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Download and install VLC from <a href="https://www.videolan.org/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">videolan.org</a></li>
                      <li>Open VLC and go to Media → Open Network Stream</li>
                      <li>Enter your RTSP URL in the format: <code>rtsp://username:password@camera-ip:port/path</code></li>
                      <li>Click Play and see if the stream loads</li>
                      <li>If it works in VLC but not in this app, the issue is likely with network connectivity between this server and your camera</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="command-line">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-blue-500" />
                      Command Line Tools
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      Here are some command line tools you can use to diagnose network connectivity issues:
                    </p>
                    
                    <h4 className="font-medium mt-3">Useful commands:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>
                        <strong>Ping:</strong> Test basic connectivity to your camera
                        <code className="block bg-muted p-2 my-1 rounded text-xs">
                          ping {currentCameraIp}
                        </code>
                      </li>
                      <li>
                        <strong>Telnet:</strong> Test if RTSP port is open
                        <code className="block bg-muted p-2 my-1 rounded text-xs">
                          telnet {currentCameraIp} 554
                        </code>
                      </li>
                      <li>
                        <strong>Traceroute:</strong> Check network path to camera
                        <code className="block bg-muted p-2 my-1 rounded text-xs">
                          traceroute {currentCameraIp}
                        </code>
                      </li>
                      <li>
                        <strong>FFmpeg:</strong> Test RTSP stream directly
                        <code className="block bg-muted p-2 my-1 rounded text-xs">
                          ffmpeg -i "rtsp://username:password@{currentCameraIp}:554/live/ch00_0" -t 3 -f null -
                        </code>
                      </li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="rtsp-relay">
                  <AccordionTrigger className="font-medium">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-purple-500" />
                      Setting Up RTSP Relay
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm space-y-2">
                    <p>
                      If your camera and this server are on different networks, consider setting up an RTSP relay:
                    </p>
                    
                    <h4 className="font-medium mt-3">Options for relaying RTSP:</h4>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>
                        <strong>Local relay server:</strong> Set up a small server (like Raspberry Pi) on your local network that can:
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Access your camera's RTSP stream</li>
                          <li>Relay it to a publicly accessible endpoint</li>
                          <li>Use tools like nginx-rtmp-module or SRS (Simple RTMP Server)</li>
                        </ul>
                      </li>
                      <li>
                        <strong>VPN solution:</strong> Set up a VPN between your local network and this server to allow direct access
                      </li>
                      <li>
                        <strong>WebRTC gateway:</strong> Some newer solutions convert RTSP to WebRTC for web-friendly streaming
                      </li>
                    </ol>
                    
                    <p className="mt-3 italic">
                      Note: Setting up a relay requires some networking knowledge and should be done with security in mind.
                      Always use strong passwords and encryption when exposing video streams.
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}