import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, RadioTower, Locate } from 'lucide-react';

interface NetworkDiagnosticsProps {
  currentCameraIp: string;
}

interface NetworkDiagnosticsResult {
  status: 'success' | 'partial' | 'failure';
  server: {
    ipAddress: string;
    isConnectedToInternet: boolean;
  };
  camera: {
    isReachable: boolean;
    isPortOpen: boolean;
    pingResult?: string;
    tracerouteResult?: string;
    error?: string;
  };
}

export function NetworkDiagnostics({ currentCameraIp }: NetworkDiagnosticsProps) {
  const [cameraIp, setCameraIp] = useState(currentCameraIp);
  const [rtspPort, setRtspPort] = useState('554');
  const { toast } = useToast();

  // Network diagnostics mutation
  const { 
    mutate: runDiagnostics, 
    data, 
    isPending, 
    isError,
    error 
  } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/network/diagnostics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cameraIp, 
          rtspPort: parseInt(rtspPort) 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Network diagnostics failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Diagnostics Complete",
        description: "Network diagnostics completed successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Diagnostics Failed",
        description: error instanceof Error ? error.message : "Failed to run network diagnostics",
        variant: "destructive",
      });
    },
  });

  const diagnostics: NetworkDiagnosticsResult | undefined = data?.diagnostics;
  const suggestions: string[] = data?.suggestions || [];

  // Render status indicators
  const renderStatusIndicator = (isSuccess: boolean | undefined, label: string) => {
    if (isSuccess === undefined) return null;
    
    return (
      <div className="flex items-center gap-2 my-1">
        {isSuccess ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <span>{label}</span>
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RadioTower className="h-5 w-5" /> 
          Network Diagnostics
        </CardTitle>
        <CardDescription>
          Troubleshoot camera connectivity issues
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="camera-ip">Camera IP Address</Label>
              <Input 
                id="camera-ip" 
                value={cameraIp} 
                onChange={(e) => setCameraIp(e.target.value)}
                placeholder="e.g. 192.168.1.100" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rtsp-port">RTSP Port</Label>
              <Input 
                id="rtsp-port" 
                value={rtspPort} 
                onChange={(e) => setRtspPort(e.target.value)}
                placeholder="e.g. 554" 
                type="number"
              />
            </div>
          </div>

          {isError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "An unknown error occurred while running diagnostics"}
              </AlertDescription>
            </Alert>
          )}

          {diagnostics && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Diagnostic Results</h3>
                <Badge 
                  variant={
                    diagnostics.status === 'success' ? 'default' : 
                    diagnostics.status === 'partial' ? 'outline' : 'destructive'
                  }
                >
                  {diagnostics.status === 'success' ? 'Success' : 
                   diagnostics.status === 'partial' ? 'Partial Connectivity' : 'Connection Failed'}
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Server Information
                  </h4>
                  <div className="pl-6 text-sm space-y-1">
                    <p>IP Address: {diagnostics.server.ipAddress}</p>
                    {renderStatusIndicator(
                      diagnostics.server.isConnectedToInternet, 
                      "Internet Connectivity"
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Locate className="h-4 w-4" />
                    Camera Connectivity
                  </h4>
                  <div className="pl-6 text-sm space-y-1">
                    {renderStatusIndicator(diagnostics.camera.isReachable, "Camera Reachable")}
                    {renderStatusIndicator(diagnostics.camera.isPortOpen, "RTSP Port Open")}
                    {diagnostics.camera.error && (
                      <p className="text-red-500 mt-1">{diagnostics.camera.error}</p>
                    )}
                  </div>
                </div>
              </div>
              
              {suggestions.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Suggestions</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    {suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="details">
                  <AccordionTrigger>Advanced Details</AccordionTrigger>
                  <AccordionContent>
                    {diagnostics.camera.pingResult && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium mb-1">Ping Results</h5>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                          {diagnostics.camera.pingResult}
                        </pre>
                      </div>
                    )}
                    
                    {diagnostics.camera.tracerouteResult && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium mb-1">Traceroute Results</h5>
                        <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                          {diagnostics.camera.tracerouteResult}
                        </pre>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          onClick={() => runDiagnostics()} 
          disabled={isPending || !cameraIp} 
          className="w-full md:w-auto"
        >
          {isPending ? (
            <>
              <Loader className="mr-2 h-4 w-4 animate-spin" />
              Running Diagnostics...
            </>
          ) : (
            'Run Network Diagnostics'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}