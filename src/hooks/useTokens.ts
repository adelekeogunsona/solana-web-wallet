import { useState, useEffect } from 'react';
import { rpcManager } from '@/utils/rpc';
import type { TokenAccount } from '@/utils/rpc';

export interface TokenData {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
  icon?: string;
  verified: boolean;
}

export function useTokens(walletAddress: string | undefined) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTokens = async () => {
      if (!walletAddress) {
        setTokens([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get all token accounts in a single call
        const tokenAccounts = await rpcManager.getTokenAccounts(walletAddress);

        // Sort by balance descending
        tokenAccounts.sort((a, b) => b.amount - a.amount);

        // Get metadata for all tokens in parallel
        const tokenDataPromises = tokenAccounts.map(async (account: TokenAccount) => {
          try {
            const metadata = await rpcManager.getTokenMetadata(account.mint);
            return {
              mint: account.mint,
              name: metadata.name,
              symbol: metadata.symbol,
              balance: account.amount,
              decimals: account.decimals,
              icon: metadata.icon,
              verified: metadata.verified,
            };
          } catch (err) {
            console.warn(`Failed to fetch metadata for token ${account.mint}:`, err);
            return {
              mint: account.mint,
              name: 'Unknown Token',
              symbol: account.mint.slice(0, 4),
              balance: account.amount,
              decimals: account.decimals,
              verified: false,
            };
          }
        });

        const tokenData = await Promise.all(tokenDataPromises);

        // Sort tokens: verified first, then by name
        tokenData.sort((a, b) => {
          if (a.verified !== b.verified) return b.verified ? 1 : -1;
          return a.name.localeCompare(b.name);
        });

        setTokens(tokenData);
      } catch (err) {
        console.error('Error fetching tokens:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch tokens');
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [walletAddress]);

  return { tokens, loading, error };
}