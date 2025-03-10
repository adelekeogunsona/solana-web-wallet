import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

type ImportMethod = 'seed' | 'private-key';

export default function ImportWallet() {
  const [importMethod, setImportMethod] = useState<ImportMethod>('seed');
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
      if (importMethod === 'seed') {
        await importWallet({
          type: 'seed',
          seedPhrase,
          password,
          confirmPassword,
        });
      } else {
        await importWallet({
          type: 'private-key',
          privateKey,
          password,
          confirmPassword,
        });
      }
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
            <div className="flex space-x-4 mb-6">
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-lg ${
                  importMethod === 'seed'
                    ? 'bg-solana-green text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
                onClick={() => setImportMethod('seed')}
              >
                Seed Phrase
              </button>
              <button
                type="button"
                className={`flex-1 py-2 px-4 rounded-lg ${
                  importMethod === 'private-key'
                    ? 'bg-solana-green text-white'
                    : 'bg-gray-700 text-gray-300'
                }`}
                onClick={() => setImportMethod('private-key')}
              >
                Private Key
              </button>
            </div>

            {importMethod === 'seed' ? (
              <div>
                <label htmlFor="seedPhrase" className="block text-sm font-medium mb-2">
                  Recovery Phrase
                </label>
                <textarea
                  id="seedPhrase"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  className="input-primary w-full h-32"
                  placeholder="Enter your 12 or 24-word recovery phrase"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  Enter your recovery phrase, with each word separated by a space
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
              <p className="mt-2 text-sm text-red-500">{error}</p>
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