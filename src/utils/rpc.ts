import { Connection, PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';
import { checkRPCEndpointHealth } from './rpcValidation';

const CONNECTION_CONFIG = {
  commitment: 'confirmed' as Commitment,
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000,
  httpHeaders: {
    'Content-Type': 'application/json',
  }
};

interface RPCEndpointStatus {
  endpoint: string;
  connection: Connection;
  isHealthy: boolean;
  lastChecked: number;
  latency: number;
}

class RPCManager {
  private endpoints: RPCEndpointStatus[];
  private currentIndex: number;
  private requestCount: number;
  private lastRequestTime: number;
  private healthCheckInterval: NodeJS.Timeout | null;

  constructor(rpcUrls: string[] = []) {
    this.endpoints = rpcUrls.map(url => ({
      endpoint: url,
      connection: new Connection(url, CONNECTION_CONFIG),
      isHealthy: true,
      lastChecked: 0,
      latency: 0,
    }));
    this.currentIndex = 0;
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
    this.healthCheckInterval = null;
    this.startHealthChecks();
  }

  private startHealthChecks() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Run health checks every 30 seconds
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAllEndpoints();
    }, 30000);
  }

  private async checkAllEndpoints() {
    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.endpoints[i];
      const health = await checkRPCEndpointHealth(endpoint.endpoint);

      this.endpoints[i] = {
        ...endpoint,
        isHealthy: health.isHealthy,
        lastChecked: Date.now(),
        latency: health.latency || Infinity,
      };
    }

    // Sort endpoints by latency (healthy endpoints first)
    this.endpoints.sort((a, b) => {
      if (a.isHealthy && !b.isHealthy) return -1;
      if (!a.isHealthy && b.isHealthy) return 1;
      return a.latency - b.latency;
    });

    // Update current index to point to the healthiest endpoint
    this.currentIndex = 0;
  }

  updateConnections(rpcUrls: string[]) {
    this.endpoints = rpcUrls.map(url => ({
      endpoint: url,
      connection: new Connection(url, CONNECTION_CONFIG),
      isHealthy: true,
      lastChecked: 0,
      latency: 0,
    }));
    this.currentIndex = 0;
    this.checkAllEndpoints();
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    if (now - this.lastRequestTime > 1000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    if (this.requestCount >= 5) {
      await this.sleep(1000);
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  private async tryConnection<T>(callback: (connection: Connection) => Promise<T>): Promise<T> {
    await this.checkRateLimit();

    // Try all healthy endpoints first
    const healthyEndpoints = this.endpoints.filter(e => e.isHealthy);
    if (healthyEndpoints.length > 0) {
      for (const endpoint of healthyEndpoints) {
        try {
          const result = await callback(endpoint.connection);
          return result;
        } catch (error) {
          console.warn(`RPC ${endpoint.endpoint} failed:`, error);
          // Mark endpoint as unhealthy
          endpoint.isHealthy = false;
          continue;
        }
      }
    }

    // If all healthy endpoints failed, try unhealthy ones as a last resort
    for (const endpoint of this.endpoints) {
      try {
        const result = await callback(endpoint.connection);
        // If successful, mark as healthy
        endpoint.isHealthy = true;
        return result;
      } catch (error) {
        console.warn(`RPC ${endpoint.endpoint} failed:`, error);
        continue;
      }
    }

    throw new Error('All RPC endpoints failed');
  }

  async getBalance(publicKey: string): Promise<number> {
    const callback = async (connection: Connection) => {
      try {
        const balance = await connection.getBalance(
          new PublicKey(publicKey),
          CONNECTION_CONFIG.commitment
        );
        return balance / LAMPORTS_PER_SOL;
      } catch (error) {
        console.error('Error in getBalance:', error);
        throw error;
      }
    };

    return this.tryConnection(callback);
  }

  // Clean up when the manager is no longer needed
  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}

// Create a singleton instance
const rpcManager = new RPCManager();

export { rpcManager, RPCManager };