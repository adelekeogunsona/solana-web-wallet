import { Connection, PublicKey, LAMPORTS_PER_SOL, Commitment, GetProgramAccountsFilter, Transaction, Message, AccountInfo } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';

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

interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
  verified: boolean;
}

interface JupiterTokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
}

interface TokenAccount {
  pubkey: PublicKey;
  mint: string;
  amount: number;
  decimals: number;
}

interface ParsedTokenAccountData {
  program: string;
  parsed: {
    info: {
      mint: string;
      owner: string;
      tokenAmount: {
        amount: string;
        decimals: number;
        uiAmount: number;
      };
    };
    type: string;
  };
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
  private tokenListCache: Map<string, JupiterTokenInfo>;
  private tokenListLastFetch: number;
  private tokenListFetchPromise: Promise<void> | null;

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
    this.tokenListCache = new Map();
    this.tokenListLastFetch = 0;
    this.tokenListFetchPromise = null;
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

  async getTokenAccounts(walletAddress: string): Promise<TokenAccount[]> {
    const callback = async (connection: Connection) => {
      try {
        const filters: GetProgramAccountsFilter[] = [
          {
            dataSize: 165, // Size of token account
          },
          {
            memcmp: {
              offset: 32, // Owner offset
              bytes: walletAddress,
            },
          },
        ];

        const accounts = await connection.getParsedProgramAccounts(
          TOKEN_PROGRAM_ID,
          { filters }
        );

        return accounts.map(account => {
          const parsedData = account.account.data as ParsedTokenAccountData;
          const mintAddress = parsedData.parsed.info.mint;
          const tokenAmount = parsedData.parsed.info.tokenAmount;

          return {
            pubkey: account.pubkey,
            mint: mintAddress,
            amount: tokenAmount.uiAmount,
            decimals: tokenAmount.decimals,
          };
        }).filter(account => account.amount > 0); // Only return accounts with non-zero balance
      } catch (error) {
        console.error('Error in getTokenAccounts:', error);
        throw error;
      }
    };

    return this.enqueueRequest(callback);
  }

  private async fetchTokenList(): Promise<void> {
    try {
      const response = await fetch('https://token.jup.ag/strict');
      const data = await response.json();

      // Clear the old cache
      this.tokenListCache.clear();

      // Update the cache with new data
      for (const token of data) {
        this.tokenListCache.set(token.address, token);
      }

      this.tokenListLastFetch = Date.now();
    } catch (error) {
      console.error('Error fetching token list:', error);
    } finally {
      this.tokenListFetchPromise = null;
    }
  }

  private async ensureTokenList(): Promise<void> {
    // If we're already fetching, wait for that to complete
    if (this.tokenListFetchPromise) {
      await this.tokenListFetchPromise;
      return;
    }

    // If the cache is older than 1 hour or empty, fetch new data
    if (Date.now() - this.tokenListLastFetch > 3600000 || this.tokenListCache.size === 0) {
      this.tokenListFetchPromise = this.fetchTokenList();
      await this.tokenListFetchPromise;
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<TokenMetadata> {
    // Ensure we have the latest token list
    await this.ensureTokenList();

    // Check Jupiter's token list
    const jupiterToken = this.tokenListCache.get(mintAddress);
    if (jupiterToken) {
      return {
        name: jupiterToken.name,
        symbol: jupiterToken.symbol,
        decimals: jupiterToken.decimals,
        icon: jupiterToken.logoURI,
        verified: true,
      };
    }

    // For unknown tokens, return minimal information
    return {
      name: 'Unknown Token',
      symbol: mintAddress.slice(0, 4),
      decimals: 0,
      verified: false,
    };
  }

  async getRecentBlockhash(): Promise<string> {
    const callback = async (connection: Connection) => {
      try {
        const { blockhash } = await connection.getLatestBlockhash(CONNECTION_CONFIG.commitment);
        return blockhash;
      } catch (error) {
        console.error('Error in getRecentBlockhash:', error);
        throw error;
      }
    };

    return this.enqueueRequest(callback);
  }

  async getFeeForMessage(message: Message): Promise<number> {
    const callback = async (connection: Connection) => {
      try {
        const response = await connection.getFeeForMessage(message, CONNECTION_CONFIG.commitment);
        if (response.value === null) {
          throw new Error('Failed to get fee for message');
        }
        return response.value;
      } catch (error) {
        console.error('Error in getFeeForMessage:', error);
        throw error;
      }
    };

    return this.enqueueRequest(callback);
  }

  async sendTransaction(transaction: Transaction): Promise<string> {
    const healthyEndpoint = this.endpoints.find(e => e.isHealthy);
    if (!healthyEndpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    try {
      const signature = await healthyEndpoint.connection.sendRawTransaction(transaction.serialize());
      return signature;
    } catch (error) {
      console.error('Failed to send transaction:', error);
      throw error;
    }
  }

  async confirmTransaction(signature: string): Promise<void> {
    const healthyEndpoint = this.endpoints.find(e => e.isHealthy);
    if (!healthyEndpoint) {
      throw new Error('No healthy RPC endpoints available');
    }

    try {
      await healthyEndpoint.connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      console.error('Failed to confirm transaction:', error);
      throw error;
    }
  }

  async getAccountInfo(address: string): Promise<AccountInfo<Buffer> | null> {
    const callback = async (connection: Connection) => {
      try {
        const pubkey = new PublicKey(address);
        const accountInfo = await connection.getAccountInfo(pubkey);
        return accountInfo;
      } catch (error) {
        console.error('Error in getAccountInfo:', error);
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
    if (this.slotCheckInterval) {
      clearInterval(this.slotCheckInterval);
      this.slotCheckInterval = null;
    }
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.balanceCache.clear();
    this.pendingBalanceRequests.clear();
    this.tokenListCache.clear();
  }
}

const rpcManager = new RPCManager();

export { rpcManager, RPCManager };
export type { RPCConfig, TokenAccount };