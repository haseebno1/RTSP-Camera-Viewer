import { exec } from 'child_process';
import { promisify } from 'util';
import * as net from 'net';
import { getIpAddress } from './network-utils';

const execAsync = promisify(exec);

export interface NetworkDiagnostics {
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

/**
 * Check if a host is reachable via ping
 */
async function pingHost(host: string): Promise<{success: boolean, output: string}> {
  try {
    // Use -c 2 to send just 2 packets for a quick check
    const { stdout, stderr } = await execAsync(`ping -c 2 -W 2 ${host}`);
    return { success: true, output: stdout };
  } catch (error) {
    return { 
      success: false, 
      output: error instanceof Error ? error.message : String(error) 
    };
  }
}

/**
 * Check if a port is open on a host
 */
async function isPortOpen(host: string, port: number, timeout = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let resolved = false;
    
    // Set timeout
    socket.setTimeout(timeout);
    
    // Handle connection success
    socket.on('connect', () => {
      resolved = true;
      socket.destroy();
      resolve(true);
    });
    
    // Handle errors and timeouts
    socket.on('error', () => {
      if (!resolved) {
        resolved = true;
        resolve(false);
      }
    });
    
    socket.on('timeout', () => {
      if (!resolved) {
        resolved = true;
        socket.destroy();
        resolve(false);
      }
    });
    
    // Attempt connection
    socket.connect(port, host);
  });
}

/**
 * Run a traceroute to see the network path to the camera
 */
async function traceroute(host: string): Promise<string> {
  try {
    // Use -m 10 to limit to 10 hops for quicker results
    const { stdout } = await execAsync(`traceroute -m 10 -w 2 ${host}`);
    return stdout;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/**
 * Check internet connectivity by attempting to resolve a well-known domain
 */
async function checkInternetConnectivity(): Promise<boolean> {
  try {
    const { stdout } = await execAsync('curl -s --connect-timeout 5 https://www.google.com');
    return stdout.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Run comprehensive network diagnostics
 */
export async function runNetworkDiagnostics(cameraIp: string, rtspPort = 554): Promise<NetworkDiagnostics> {
  const serverIp = getIpAddress();
  
  // Run tests in parallel for efficiency
  const [pingResults, portCheck, traceResults, internetCheck] = await Promise.all([
    pingHost(cameraIp),
    isPortOpen(cameraIp, rtspPort),
    traceroute(cameraIp),
    checkInternetConnectivity()
  ]);
  
  return {
    status: pingResults.success && portCheck ? 'success' : pingResults.success || portCheck ? 'partial' : 'failure',
    server: {
      ipAddress: serverIp,
      isConnectedToInternet: internetCheck
    },
    camera: {
      isReachable: pingResults.success,
      isPortOpen: portCheck,
      pingResult: pingResults.output,
      tracerouteResult: traceResults,
      error: !pingResults.success ? 'Camera IP is not reachable' : 
             !portCheck ? 'RTSP port is closed or blocked' : undefined
    }
  };
}

/**
 * Extract network from IP address (e.g., 192.168.1.x)
 */
export function getNetworkFromIp(ip: string): string {
  const parts = ip.split('.');
  if (parts.length !== 4) return '';
  return `${parts[0]}.${parts[1]}.${parts[2]}`;
}

/**
 * Check if two IPs are on the same network
 */
export function areOnSameNetwork(ip1: string, ip2: string): boolean {
  return getNetworkFromIp(ip1) === getNetworkFromIp(ip2);
}

/**
 * Get network configuration suggestions based on diagnostics
 */
export function getConnectionSuggestions(diagnostics: NetworkDiagnostics, cameraIp: string): string[] {
  const suggestions: string[] = [];
  const serverIp = diagnostics.server.ipAddress;
  
  // Check if on same network
  if (!areOnSameNetwork(serverIp, cameraIp)) {
    suggestions.push(
      'Your camera and server are on different networks. Consider connecting them to the same network.'
    );
  }
  
  // Internet connectivity issue
  if (!diagnostics.server.isConnectedToInternet) {
    suggestions.push(
      'Your server does not have internet connectivity. This may limit some functionality.'
    );
  }
  
  // Camera reachability
  if (!diagnostics.camera.isReachable) {
    suggestions.push(
      'Cannot reach your camera. Verify it is powered on and connected to the network.'
    );
  }
  
  // Port issues
  if (diagnostics.camera.isReachable && !diagnostics.camera.isPortOpen) {
    suggestions.push(
      'Your camera is reachable but the RTSP port (554) is closed. Check if your camera has RTSP enabled.'
    );
  }
  
  // If all checks failed
  if (suggestions.length === 0 && diagnostics.status !== 'success') {
    suggestions.push(
      'All basic checks passed but connection still fails. Your camera may require specific authentication or have non-standard RTSP paths.'
    );
  }
  
  return suggestions;
}