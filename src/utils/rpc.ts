import { Connection, PublicKey, LAMPORTS_PER_SOL, Commitment } from '@solana/web3.js';

// Add multiple RPCs for failover
const RPC_URLS = [
  'https://solana-mainnet.g.alchemy.com/v2/pXbSST9euJExzt2_FS5urgSqdNOmlIzY',
  'https://crimson-omniscient-county.solana-mainnet.quiknode.pro/1d06d567063ef9e44ac67d19d42c206d0d47ec76'
];

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

  constructor() {
    this.connections = RPC_URLS.map(url => new Connection(url, CONNECTION_CONFIG));
    this.currentIndex = 0;
  }

  private async tryConnection<T>(callback: (connection: Connection) => Promise<T>): Promise<T> {
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

export const rpcManager = new RPCManager();