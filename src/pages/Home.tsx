import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContextTypes';
import TokenCard from '../components/TokenCard';
import WalletGrid from '../components/WalletGrid';
import { rpcManager } from '../utils/rpc';

const DUMMY_TOKENS = [
  { id: 1, name: 'Serum', symbol: 'SRM', balance: 1000 },
  { id: 2, name: 'Raydium', symbol: 'RAY', balance: 500 },
  { id: 3, name: 'Star Atlas', symbol: 'ATLAS', balance: 2500 },
];

interface SeedPhrasePopupProps {
  seedPhrase: string;
  onClose: () => void;
}

const SeedPhrasePopup = ({ seedPhrase, onClose }: SeedPhrasePopupProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700 shadow-xl">
        <h2 className="text-2xl font-bold mb-4 text-white">Save Your Seed Phrase</h2>
        <p className="text-gray-300 mb-4">
          Please save this seed phrase somewhere safe. You will need it to recover your wallet.
          Never share it with anyone.
        </p>
        <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
          <p className="font-mono break-all text-gray-100">{seedPhrase}</p>
        </div>
        <div className="flex justify-between items-center">
          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!copied}
          >
            I've Saved It
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { currentWallet, wallets = [], switchWallet, removeWallet } = useContext(AuthContext);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tempWalletData = localStorage.getItem('temp_wallet_data');
    if (tempWalletData) {
      try {
        const { mnemonic } = JSON.parse(tempWalletData);
        setSeedPhrase(mnemonic);
      } catch (error) {
        console.error('Error parsing temporary wallet data:', error);
      }
    }
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!Array.isArray(wallets)) {
        setError('No wallets available');
        return;
      }

      const newBalances: Record<string, number> = {};

      for (const wallet of wallets) {
        try {
          const solBalance = await rpcManager.getBalance(wallet.publicKey);
          newBalances[wallet.publicKey] = solBalance;
        } catch (error) {
          console.error(`Error fetching balance for ${wallet.publicKey}:`, error);
          newBalances[wallet.publicKey] = 0;
        }
      }

      setBalances(newBalances);
    };

    fetchBalances();
    // Set up an interval to refresh balances every 30 seconds
    const intervalId = setInterval(fetchBalances, 30000);

    return () => clearInterval(intervalId);
  }, [wallets]);

  const handleCloseSeedPhrase = () => {
    localStorage.removeItem('temp_wallet_data');
    setSeedPhrase(null);
  };

  const handleDelete = async (walletId: string) => {
    try {
      await removeWallet(walletId);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete wallet');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Link to="/setup" className="btn-primary">
            Setup Wallet
          </Link>
        </div>
      </div>
    );
  }

  // Transform wallets data to include balance and lastUsed
  const walletsWithData = Array.isArray(wallets) ? wallets.map(wallet => ({
    id: wallet.id,
    name: wallet.name || 'Unnamed Wallet',
    address: wallet.publicKey,
    balance: balances[wallet.publicKey],
    isFavorite: wallet.isFavorite || false,
    lastUsed: wallet.lastUsed ? new Date(wallet.lastUsed) : undefined
  })) : [];

  return (
    <div className="space-y-8">
      {seedPhrase && (
        <SeedPhrasePopup
          seedPhrase={seedPhrase}
          onClose={handleCloseSeedPhrase}
        />
      )}

      <WalletGrid
        wallets={walletsWithData}
        activeWalletId={currentWallet?.id}
        onWalletSelect={switchWallet}
        onWalletDelete={handleDelete}
      />

      <div>
        <h2 className="text-2xl font-bold mb-6">Tokens</h2>
        <div className="space-y-4">
          {DUMMY_TOKENS.map((token) => (
            <TokenCard
              key={token.id}
              name={token.name}
              symbol={token.symbol}
              balance={token.balance}
            />
          ))}
        </div>
      </div>
    </div>
  );
}