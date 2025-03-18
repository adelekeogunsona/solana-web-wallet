import { useState } from 'react';
import { useTokens, TokenData } from '@/hooks/useTokens';
import TokenSendModal from './TokenSendModal';

interface TokenSectionProps {
  activeWalletAddress?: string;
  walletId?: string;
}

export default function TokenSection({ activeWalletAddress, walletId }: TokenSectionProps) {
  const { tokens, loading, error } = useTokens(activeWalletAddress);
  const [selectedToken, setSelectedToken] = useState<TokenData | null>(null);

  const handleSendClick = (token: TokenData) => {
    setSelectedToken(token);
  };

  const handleCloseTokenSend = () => {
    setSelectedToken(null);
  };

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
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-white font-medium">{token.balance.toLocaleString()}</p>
                  <p className="text-sm text-gray-400">{token.symbol}</p>
                </div>
                <button
                  onClick={() => handleSendClick(token)}
                  className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-600 transition-colors"
                  title={`Send ${token.symbol}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedToken && walletId && (
        <TokenSendModal
          walletId={walletId}
          token={selectedToken}
          isOpen={!!selectedToken}
          onClose={handleCloseTokenSend}
        />
      )}
    </section>
  );
}