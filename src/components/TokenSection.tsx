import { useTokens, TokenData } from '@/hooks/useTokens';

interface TokenSectionProps {
  activeWalletAddress?: string;
}

export default function TokenSection({ activeWalletAddress }: TokenSectionProps) {
  const { tokens, loading, error } = useTokens(activeWalletAddress);

  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-white mb-4">Tokens</h2>

      {loading && (
        <div className="space-y-4">
          <div className="h-16 bg-gray-800 animate-pulse rounded-lg" />
          <div className="h-16 bg-gray-800 animate-pulse rounded-lg" />
          <div className="h-16 bg-gray-800 animate-pulse rounded-lg" />
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 text-red-400 rounded-lg">
          <p>Failed to load tokens: {error}</p>
        </div>
      )}

      {!loading && !error && tokens.length === 0 && (
        <div className="p-4 text-center text-gray-400">
          <p>No tokens found in this wallet</p>
        </div>
      )}

      {!loading && !error && tokens.length > 0 && (
        <div className="space-y-2">
          {tokens.map((token: TokenData) => (
            <div
              key={token.mint}
              className="flex items-center justify-between p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                  {token.icon ? (
                    <img src={token.icon} alt={token.symbol} className="w-6 h-6" />
                  ) : (
                    <span className="text-lg font-bold text-gray-400">
                      {token.symbol[0]}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-medium">{token.name}</h3>
                  <p className="text-sm text-gray-400">{token.symbol}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">{token.balance.toLocaleString()}</p>
                <p className="text-sm text-gray-400">{token.symbol}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}