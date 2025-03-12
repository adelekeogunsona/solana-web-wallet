import { Connection } from '@solana/web3.js';

export interface RPCHealthCheckResult {
  isValid: boolean;
  isHealthy: boolean;
  error?: string;
  latency?: number;
}

export async function validateAndCheckRPCHealth(endpoint: string): Promise<RPCHealthCheckResult> {
  // First, validate the URL format
  try {
    const url = new URL(endpoint);
    if (!url.protocol.startsWith('http')) {
      return {
        isValid: false,
        isHealthy: false,
        error: 'Invalid protocol. Must be HTTP or HTTPS',
      };
    }
  } catch (error) {
    return {
      isValid: false,
      isHealthy: false,
      error: 'Invalid URL format: ' + error,
    };
  }

  // Then check if the endpoint is responsive
  try {
    const connection = new Connection(endpoint);
    const startTime = performance.now();

    // Try to get the latest block height as a health check
    await connection.getSlot();

    const endTime = performance.now();
    const latency = endTime - startTime;

    return {
      isValid: true,
      isHealthy: true,
      latency,
    };
  } catch (error) {
    return {
      isValid: true,
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Failed to connect to RPC endpoint',
    };
  }
}

export async function checkRPCEndpointHealth(endpoint: string): Promise<RPCHealthCheckResult> {
  try {
    const connection = new Connection(endpoint);
    const startTime = performance.now();

    await connection.getSlot();

    const endTime = performance.now();
    const latency = endTime - startTime;

    return {
      isValid: true,
      isHealthy: true,
      latency,
    };
  } catch (error) {
    return {
      isValid: true,
      isHealthy: false,
      error: error instanceof Error ? error.message : 'Failed to connect to RPC endpoint',
    };
  }
}