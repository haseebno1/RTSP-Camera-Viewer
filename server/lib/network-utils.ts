import { networkInterfaces } from 'os';

/**
 * Get the IP address of the machine
 * @returns The public IP address, or localhost if none found
 */
export function getIpAddress(): string {
  const nets = networkInterfaces();
  const results: string[] = [];

  // Get all network interfaces
  for (const name of Object.keys(nets)) {
    const interfaces = nets[name];
    if (!interfaces) continue;
    
    for (const net of interfaces) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }

  // Use REPLIT_HOSTED_ADDRESS env var if available
  if (process.env.REPLIT_HOSTED_ADDRESS) {
    return process.env.REPLIT_HOSTED_ADDRESS;
  }
  
  // Use the first found IP, or localhost
  return results[0] || 'localhost';
}

/**
 * Format a WebSocket URL using the application's IP address
 * @param port The port to connect to
 * @returns The WebSocket URL
 */
export function formatWsUrl(port: number): string {
  const ipAddress = getIpAddress();
  return `ws://${ipAddress}:${port}`;
}