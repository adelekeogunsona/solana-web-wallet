import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type ImportMethod = 'seed' | 'private-key';

export default function ImportWallet() {
  const [method, setMethod] = useState<ImportMethod>('seed');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { importWallet } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await importWallet({
        type: method,
        seedPhrase: method === 'seed' ? seedPhrase : undefined,
        privateKey: method === 'private-key' ? privateKey : undefined,
        password,
        confirmPassword,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-solana-green">Import Wallet</h1>
          <p className="mt-2 text-gray-400">
            Import your existing wallet using seed phrase or private key
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Import Method</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    method === 'seed'
                      ? 'bg-solana-green text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setMethod('seed')}
                >
                  Seed Phrase
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    method === 'private-key'
                      ? 'bg-solana-green text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                  onClick={() => setMethod('private-key')}
                >
                  Private Key
                </button>
              </div>
            </div>

            {method === 'seed' ? (
              <div>
                <label htmlFor="seedPhrase" className="block text-sm font-medium mb-2">
                  Seed Phrase
                </label>
                <textarea
                  id="seedPhrase"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  className="input-primary w-full h-32"
                  placeholder="Enter your 12 or 24 word seed phrase"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  Enter your seed phrase with words separated by spaces
                </p>
              </div>
            ) : (
              <div>
                <label htmlFor="privateKey" className="block text-sm font-medium mb-2">
                  Private Key
                </label>
                <input
                  id="privateKey"
                  type="text"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  className="input-primary w-full"
                  placeholder="Enter your private key"
                  required
                />
              </div>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-2">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-primary w-full"
                placeholder="Enter your master password"
                required
                minLength={8}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="input-primary w-full"
                placeholder="Confirm your master password"
                required
                minLength={8}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex justify-center items-center"
              disabled={isLoading}
            >
              {isLoading ? 'Importing...' : 'Import Wallet'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}