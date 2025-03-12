import { useTokens, TokenData } from '@/hooks/useTokens';
import TokenCard from './TokenCard';

interface TokenListProps {
  walletAddress: string;
}

export default function TokenList({ walletAddress }: TokenListProps) {
  const { tokens, loading, error } = useTokens(walletAddress);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
        <div className="h-16 bg-gray-100 dark:bg-gray-700 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
        <p>Failed to load tokens: {error}</p>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        <p>No tokens found in this wallet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tokens.map((token: TokenData) => (
        <TokenCard
          key={token.mint}
          name={token.name}
          symbol={token.symbol}
          balance={token.balance}
          icon={token.icon}
        />
      ))}
    </div>
  );
}