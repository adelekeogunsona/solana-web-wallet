import { Connection, PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';

const CONNECTION_CONFIG = {
  commitment: 'confirmed' as Commitment,
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 0,
  wsEndpoint: undefined,
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
  lastSlot?: number;
}

interface RPCConfig {
  requestsPerBatch: number;
  delayBetweenBatches: number;
  healthCheckInterval: number;
  maxQueueSize: number;
  maxRetries: number;
  retryDelay: number;
  balanceCacheDuration: number;
  slotRefreshInterval: number;
}

const DEFAULT_CONFIG: RPCConfig = {
  requestsPerBatch: 15,
  delayBetweenBatches: 1000,
  healthCheckInterval: 30000,
  maxQueueSize: 100,
  maxRetries: 3,
  retryDelay: 1000,
  balanceCacheDuration: 5000,
  slotRefreshInterval: 60000,
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
  private slotCheckInterval: NodeJS.Timeout | null;
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
    this.slotCheckInterval = null;
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.lastHealthCheck = 0;
    this.balanceCache = new Map();
    this.pendingBalanceRequests = new Map();
    this.startHealthChecks();
    this.startSlotPolling();
  }

  private async checkEndpointHealth(endpoint: RPCEndpointStatus): Promise<boolean> {
    try {
      await endpoint.connection.getVersion();
      return true;
    } catch (error) {
      console.warn(`Health check failed for endpoint ${endpoint.endpoint}:`, error);
      return false;
    }
  }

  private async checkAllEndpoints() {
    this.lastHealthCheck = Date.now();

    const healthChecks = this.endpoints.map(async (endpoint, index) => {
      const isHealthy = await this.checkEndpointHealth(endpoint);

      this.endpoints[index] = {
        ...endpoint,
        isHealthy,
        lastChecked: Date.now(),
        latency: isHealthy ? (Date.now() - this.lastHealthCheck) : Infinity,
      };
    });

    await Promise.all(healthChecks);

    this.endpoints.sort((a, b) => {
      if (a.isHealthy && !b.isHealthy) return -1;
      if (!a.isHealthy && b.isHealthy) return 1;
      return a.latency - b.latency;
    });
  }

  private async pollSlots() {
    const healthyEndpoint = this.endpoints.find(e => e.isHealthy);
    if (!healthyEndpoint) return;

    try {
      const slot = await healthyEndpoint.connection.getSlot();
      healthyEndpoint.lastSlot = slot;
    } catch (error) {
      console.warn(`Slot polling failed for endpoint ${healthyEndpoint.endpoint}:`, error);
    }
  }

  private startSlotPolling() {
    if (this.slotCheckInterval) {
      clearInterval(this.slotCheckInterval);
    }

    this.pollSlots().catch(console.error);

    this.slotCheckInterval = setInterval(() => {
      this.pollSlots().catch(console.error);
    }, this.config.slotRefreshInterval);
  }

  updateConfig(config: Partial<RPCConfig>) {
    this.config = { ...this.config, ...config };
    this.startHealthChecks();
    this.startSlotPolling();
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
    const cached = this.balanceCache.get(publicKey);
    if (cached && this.isCacheValid(cached)) {
      return cached.balance;
    }

    const pending = this.pendingBalanceRequests.get(publicKey);
    if (pending) {
      return pending;
    }

    const balancePromise = this.fetchBalance(publicKey);
    this.pendingBalanceRequests.set(publicKey, balancePromise);

    try {
      const balance = await balancePromise;
      this.balanceCache.set(publicKey, {
        balance,
        timestamp: Date.now(),
      });
      return balance;
    } finally {
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

  private startHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.checkAllEndpoints().catch(console.error);

    this.healthCheckInterval = setInterval(() => {
      const now = Date.now();
      if (now - this.lastHealthCheck >= this.config.healthCheckInterval) {
        this.checkAllEndpoints().catch(console.error);
      }
    }, this.config.healthCheckInterval);
  }

  destroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    if (this.slotCheckInterval) {
      clearInterval(this.slotCheckInterval);
      this.slotCheckInterval = null;
    }
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.balanceCache.clear();
    this.pendingBalanceRequests.clear();
  }
}

const rpcManager = new RPCManager();

export { rpcManager, RPCManager };
export type { RPCConfig };