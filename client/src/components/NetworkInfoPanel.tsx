import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getQueryFn } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Loader, Wifi, WifiOff, Copy, ExternalLink } from 'lucide-react';

interface NetworkInfo {
  ipAddress: string;
  hostname: string;
  port: number;
  wsUrl: string;
  httpUrl: string;
}

export function NetworkInfoPanel() {
  const [copied, setCopied] = useState<string | null>(null);

  // Fetch network information
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/network/info'],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const networkInfo: NetworkInfo | undefined = data && 'network' in data ? data.network : undefined;

  // Reset copied state after 2 seconds
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Loader className="w-4 h-4 mr-2 animate-spin" />
            Loading Network Information
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (isError || !networkInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-red-500">
            <WifiOff className="w-4 h-4 mr-2" />
            Network Information Unavailable
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Could not retrieve network information. This may affect your ability to connect to local devices.
          </p>
          <Button onClick={() => refetch()} size="sm" variant="outline">Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wifi className="w-4 h-4 mr-2" />
          Network Connection
        </CardTitle>
        <CardDescription>
          Use this information to connect to your local network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-1">Server IP Address</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-1 font-mono text-xs">
                {networkInfo.ipAddress}
              </Badge>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => copyToClipboard(networkInfo.ipAddress, 'ip')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {copied === 'ip' && <span className="text-xs text-green-500">Copied!</span>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">HTTP URL</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-1 font-mono text-xs">
                {networkInfo.httpUrl}
              </Badge>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => copyToClipboard(networkInfo.httpUrl, 'http')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => window.open(networkInfo.httpUrl, '_blank')}
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              {copied === 'http' && <span className="text-xs text-green-500">Copied!</span>}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-1">WebSocket URL</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-2 py-1 font-mono text-xs">
                {networkInfo.wsUrl}
              </Badge>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8" 
                onClick={() => copyToClipboard(networkInfo.wsUrl, 'ws')}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {copied === 'ws' && <span className="text-xs text-green-500">Copied!</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}