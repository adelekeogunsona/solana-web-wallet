import { Link } from 'react-router-dom';
import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/authContextTypes';
import WalletCard from '../components/WalletCard';
import TokenCard from '../components/TokenCard';
import TransactionList from '../components/TransactionList';

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
  const { currentWallet } = useContext(AuthContext);
  const [seedPhrase, setSeedPhrase] = useState<string | null>(null);

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

  const handleCloseSeedPhrase = () => {
    localStorage.removeItem('temp_wallet_data');
    setSeedPhrase(null);
  };

  return (
    <div className="space-y-8">
      {seedPhrase && (
        <SeedPhrasePopup
          seedPhrase={seedPhrase}
          onClose={handleCloseSeedPhrase}
        />
      )}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Wallets</h1>
          <div className="space-x-4">
            <Link to="/transfer" className="btn-primary">
              Send / Receive
            </Link>
            <button className="btn-secondary">
              Add New Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <WalletCard
            name="Main Wallet"
            address={currentWallet?.publicKey || 'No wallet connected'}
            balance={12.345}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

        <div>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}