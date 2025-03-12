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

interface RPCConfig {
  requestsPerBatch: number;
  delayBetweenBatches: number;
  healthCheckInterval: number;
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number;
  balanceCacheDuration: number;
}

const DEFAULT_CONFIG: RPCConfig = {
  requestsPerBatch: 5,
  delayBetweenBatches: 1000,
  healthCheckInterval: 30000,
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  balanceCacheDuration: 5000, // Cache balances for 5 seconds
};

interface QueuedRequest<T> {
  callback: (connection: Connection) => Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason: unknown) => void;
  retryCount: number;
}

interface CachedBalance {
  balance: number;
  timestamp: number;
}

class RPCManager {
  private endpoints: RPCEndpointStatus[];
  private requestCount: number;
  private healthCheckInterval: NodeJS.Timeout | null;
  private config: RPCConfig;
  private requestQueue: Array<QueuedRequest<unknown>>;
  private isProcessingQueue: boolean;
  private lastHealthCheck: number;
  private balanceCache: Map<string, CachedBalance>;
  private pendingBalanceRequests: Map<string, Promise<number>>;

  constructor(rpcUrls: string[] = [], config: Partial<RPCConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.endpoints = rpcUrls.map(url => ({
      endpoint: url,
      connection: new Connection(url, CONNECTION_CONFIG),
      isHealthy: true,
      lastChecked: 0,
      latency: 0,
    }));
    this.requestCount = 0;
    this.healthCheckInterval = null;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastHealthCheck = 0;
    this.balanceCache = new Map();
    this.pendingBalanceRequests = new Map();
    this.startHealthChecks();
  }

  private startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Initial health check
    this.checkAllEndpoints().catch(console.error);

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      // Only run health check if enough time has passed since last check
      if (now - this.lastHealthCheck >= this.config.healthCheckInterval) {
        this.checkAllEndpoints().catch(console.error);
      }
    }, this.config.healthCheckInterval);
  }

  private async checkAllEndpoints() {
    this.lastHealthCheck = Date.now();

    for (let i = 0; i < this.endpoints.length; i++) {
      const endpoint = this.endpoints[i];
      try {
        const health = await checkRPCEndpointHealth(endpoint.endpoint);

        this.endpoints[i] = {
          ...endpoint,
          isHealthy: health.isHealthy,
          lastChecked: Date.now(),
          latency: health.latency || Infinity,
        };
      } catch (error) {
        console.warn(`Health check failed for endpoint ${endpoint.endpoint}:`, error);
        this.endpoints[i] = {
          ...endpoint,
          isHealthy: false,
          lastChecked: Date.now(),
          latency: Infinity,
        };
      }
    }

    // Sort endpoints by latency (healthy endpoints first)
    this.endpoints.sort((a, b) => {
      if (a.isHealthy && !b.isHealthy) return -1;
      if (!a.isHealthy && b.isHealthy) return 1;
      return a.latency - b.latency;
    });
  }

  updateConfig(config: Partial<RPCConfig>) {
    this.config = { ...this.config, ...config };
    this.startHealthChecks();
  }

  updateConnections(rpcUrls: string[]) {
    this.endpoints = rpcUrls.map(url => ({
      endpoint: url,
      connection: new Connection(url, CONNECTION_CONFIG),
      isHealthy: true,
      lastChecked: 0,
      latency: 0,
    }));
    this.checkAllEndpoints().catch(console.error);
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkRateLimit(): Promise<void> {
    this.requestCount++;

    if (this.requestCount >= this.config.requestsPerBatch) {
      await this.sleep(this.config.delayBetweenBatches);
      this.requestCount = 0;
    }
  }

  private async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) return;

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      try {
        const result = await this.executeRequest(request.callback, request.retryCount);
        (request.resolve as (value: unknown) => void)(result);
      } catch (error) {
        if (request.retryCount < this.config.maxRetries) {
          // Re-queue the request with incremented retry count
          await this.sleep(this.config.retryDelay);
          this.requestQueue.push({
            ...request,
            retryCount: request.retryCount + 1,
          });
        } else {
          request.reject(error);
        }
      }
      await this.checkRateLimit();
    }

    this.isProcessingQueue = false;
  }

  private async executeRequest<T>(
    callback: (connection: Connection) => Promise<T>,
    retryCount: number
  ): Promise<T> {
    await this.checkRateLimit();

    // Try all healthy endpoints first
    const healthyEndpoints = this.endpoints.filter(e => e.isHealthy);
    if (healthyEndpoints.length > 0) {
      for (const endpoint of healthyEndpoints) {
        try {
          const result = await callback(endpoint.connection);
          return result;
        } catch (error) {
          console.warn(`RPC ${endpoint.endpoint} failed (retry ${retryCount}):`, error);
          endpoint.isHealthy = false;
          continue;
        }
      }
    }

    // If all healthy endpoints failed, try unhealthy ones as a last resort
    for (const endpoint of this.endpoints) {
      try {
        const result = await callback(endpoint.connection);
        endpoint.isHealthy = true;
        return result;
      } catch (error) {
        console.warn(`RPC ${endpoint.endpoint} failed (retry ${retryCount}):`, error);
        continue;
      }
    }

    throw new Error(`All RPC endpoints failed (retry ${retryCount})`);
  }

  private enqueueRequest<T>(callback: (connection: Connection) => Promise<T>): Promise<T> {
    if (this.requestQueue.length >= this.config.maxQueueSize) {
      return Promise.reject(new Error('Request queue is full'));
    }

    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({
        callback,
        resolve: resolve as (value: unknown) => void,
        reject,
        retryCount: 0,
      } as QueuedRequest<unknown>);
      this.processQueue().catch(console.error);
    });
  }

  private isCacheValid(cached: CachedBalance): boolean {
    return Date.now() - cached.timestamp < this.config.balanceCacheDuration;
  }

  async getBalance(publicKey: string): Promise<number> {
    // Check if there's a valid cached balance
    const cached = this.balanceCache.get(publicKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.balance;
    }

    // Check if there's already a pending request for this address
    const pending = this.pendingBalanceRequests.get(publicKey);
    if (pending) {
      return pending;
    }

    // Create new balance request
    const balancePromise = this.fetchBalance(publicKey);
    this.pendingBalanceRequests.set(publicKey, balancePromise);

    try {
      const balance = await balancePromise;
      // Cache the result
      this.balanceCache.set(publicKey, {
        balance,
        timestamp: Date.now(),
      });
      return balance;
    } finally {
      // Clean up pending request
      this.pendingBalanceRequests.delete(publicKey);
    }
  }

  private async fetchBalance(publicKey: string): Promise<number> {
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

    return this.enqueueRequest(callback);
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    // Clear all caches and queues
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.balanceCache.clear();
    this.pendingBalanceRequests.clear();
  }
}

// Create a singleton instance with default config
const rpcManager = new RPCManager();

export { rpcManager, RPCManager };
export type { RPCConfig };