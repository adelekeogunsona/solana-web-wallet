import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContextTypes';
import { useSettings } from '../hooks/useSettings';
import TokenCard from '../components/TokenCard';
import WalletGrid from '../components/WalletGrid';
import { rpcManager } from '../utils/rpc';
import PinInput from '../components/PinInput';

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

interface BackupPopupProps {
  seedPhrase: string;
  onClose: () => void;
  isPrivateKey?: boolean;
}

const BackupPopup = ({ seedPhrase, onClose, isPrivateKey = false }: BackupPopupProps) => {
  const [copied, setCopied] = useState(false);
  const [showPin, setShowPin] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState(false);

  const handlePinSubmit = (pin: string) => {
    const sessionPin = localStorage.getItem('session_pin');
    if (!sessionPin) {
      setError(true);
      return;
    }

    if (pin === sessionPin) {
      setError(false);
      setShowPin(false);
      setShowSecret(true);
    } else {
      setError(true);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(seedPhrase);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (showPin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">Enter PIN to Continue</h2>
          <p className="text-gray-300 mb-4">
            Please enter your PIN to view the {isPrivateKey ? 'private key' : 'seed phrase'}.
          </p>
          {error && (
            <p className="text-red-500 mb-4">
              Invalid PIN. Please try again.
            </p>
          )}
          <PinInput onComplete={handlePinSubmit} error={error} />
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showSecret) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-900 rounded-lg p-6 max-w-lg w-full mx-4 border border-gray-700 shadow-xl">
          <h2 className="text-2xl font-bold mb-4 text-white">
            Your {isPrivateKey ? 'Private Key' : 'Seed Phrase'}
          </h2>
          <p className="text-gray-300 mb-4">
            Never share this {isPrivateKey ? 'private key' : 'seed phrase'} with anyone.
            Store it in a safe place.
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
  }

  return null;
};

export default function Home() {
  const { currentWallet, wallets = [], switchWallet, removeWallet, getWalletBackupData } = useContext(AuthContext);
  const { settings } = useSettings();
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);
  const [backupData, setBackupData] = useState<{ data: string; isPrivateKey: boolean } | null>(null);
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
    // Update RPC endpoints when settings change
    if (settings.rpcEndpoints.length === 0) {
      setError('Please configure at least one RPC endpoint in Settings');
      return;
    }
    rpcManager.updateConnections(settings.rpcEndpoints);
  }, [settings.rpcEndpoints]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!Array.isArray(wallets)) {
        setError('No wallets available');
        return;
      }

      if (settings.rpcEndpoints.length === 0) {
        return; // Don't try to fetch balances if no RPC endpoints are configured
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
    // Set up an interval to refresh balances based on settings
    const intervalId = setInterval(fetchBalances, settings.balanceReloadInterval);

    return () => clearInterval(intervalId);
  }, [wallets, settings.balanceReloadInterval, settings.rpcEndpoints]);

  const handleCloseSeedPhrase = () => {
    localStorage.removeItem('temp_wallet_data');
    setSeedPhrase(null);
  };

  const handleCloseBackup = () => {
    setBackupData(null);
  };

  const handleDelete = async (walletId: string) => {
    try {
      await removeWallet(walletId);
    } catch (error) {
      console.error('Failed to delete wallet:', error);
      alert(error instanceof Error ? error.message : 'Failed to delete wallet');
    }
  };

  const handleBackup = async (walletId: string) => {
    try {
      const data = await getWalletBackupData(walletId);
      setBackupData(data);
    } catch (error) {
      console.error('Failed to get backup data:', error);
      alert(error instanceof Error ? error.message : 'Failed to get backup data');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          {settings.rpcEndpoints.length === 0 && (
            <Link to="/settings" className="btn-primary">
              Configure RPC Endpoint
            </Link>
          )}
          {settings.rpcEndpoints.length > 0 && (
            <Link to="/setup" className="btn-primary">
              Setup Wallet
            </Link>
          )}
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

      {backupData && (
        <BackupPopup
          seedPhrase={backupData.data}
          onClose={handleCloseBackup}
          isPrivateKey={backupData.isPrivateKey}
        />
      )}

      <WalletGrid
        wallets={walletsWithData}
        activeWalletId={currentWallet?.id}
        onWalletSelect={switchWallet}
        onWalletDelete={handleDelete}
        onWalletBackup={handleBackup}
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