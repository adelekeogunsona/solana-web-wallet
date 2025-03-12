import { Connection, PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';

const CONNECTION_CONFIG = {
  commitment: 'confirmed' as Commitment,
  disableRetryOnRateLimit: false,
  confirmTransactionInitialTimeout: 60000,
  httpHeaders: {
    'Content-Type': 'application/json',
  }
};

class RPCManager {
  private connections: Connection[];
  private currentIndex: number;
  private requestCount: number;
  private lastRequestTime: number;

  constructor(rpcUrls: string[] = []) {
    this.connections = rpcUrls.map(url => new Connection(url, CONNECTION_CONFIG));
    this.currentIndex = 0;
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  updateConnections(rpcUrls: string[]) {
    this.connections = rpcUrls.map(url => new Connection(url, CONNECTION_CONFIG));
    this.currentIndex = 0;
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async checkRateLimit(): Promise<void> {
    // Reset counter if more than a second has passed
    const now = Date.now();
    if (now - this.lastRequestTime > 1000) {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }

    // If we've made 5 requests, wait for a second
    if (this.requestCount >= 5) {
      await this.sleep(1000);
      this.requestCount = 0;
      this.lastRequestTime = Date.now();
    }

    this.requestCount++;
  }

  private async tryConnection<T>(callback: (connection: Connection) => Promise<T>): Promise<T> {
    await this.checkRateLimit();

    const startIndex = this.currentIndex;
    let lastError: Error | null = null;

    for (let i = 0; i < this.connections.length; i++) {
      const connectionIndex = (startIndex + i) % this.connections.length;
      const connection = this.connections[connectionIndex];

      try {
        const result = await callback(connection);
        this.currentIndex = connectionIndex; // Remember successful connection
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.warn(`RPC ${connectionIndex} failed:`, error);
        continue;
      }
    }

    throw new Error(`All RPCs failed. Last error: ${lastError?.message || 'Unknown error'}`);
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
}

// Create a singleton instance
const rpcManager = new RPCManager();

export { rpcManager, RPCManager };