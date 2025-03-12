import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { generateNewWallet, generateRandomWalletName } from '../utils/wallet';

export function AddWallet() {
  const navigate = useNavigate();
  const { addWallet } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [walletName, setWalletName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);

  const handleCreateWallet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { mnemonic } = generateNewWallet();
      // Store the mnemonic temporarily so it can be shown in the Home page
      localStorage.setItem('temp_wallet_data', JSON.stringify({ mnemonic }));

      await addWallet({
        type: 'seed',
        seedPhrase: mnemonic,
        name: walletName.trim() || generateRandomWalletName(),
        password: '', // This will be handled by the context using the existing PIN
        confirmPassword: ''
      });

      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  if (showNameInput) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Create New Wallet</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Give your new wallet a name
            </p>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Wallet Name (Optional)</label>
              <input
                type="text"
                value={walletName}
                onChange={(e) => setWalletName(e.target.value)}
                placeholder="My Wallet"
                className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => setShowNameInput(false)}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                onClick={handleCreateWallet}
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Wallet'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Add New Wallet</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Create a new wallet or import an existing one
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => setShowNameInput(true)}
            disabled={isLoading}
            className="p-6 text-left bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Create New Wallet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Generate a new wallet with a secure recovery phrase
            </p>
          </button>

          <button
            onClick={() => navigate('/add-wallet/import')}
            disabled={isLoading}
            className="p-6 text-left bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-shadow"
          >
            <h3 className="text-lg font-semibold mb-2">Import Existing Wallet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Import a wallet using seed phrase or private key
            </p>
          </button>

          <button
            onClick={() => navigate('/')}
            className="mt-4 w-full py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}