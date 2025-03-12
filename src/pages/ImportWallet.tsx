import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PinInput from '../components/PinInput';

export default function ImportWallet() {
  const [importType, setImportType] = useState<'seed' | 'private'>('seed');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
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
        type: importType,
        seedPhrase: importType === 'seed' ? seedPhrase : undefined,
        privateKey: importType === 'private' ? privateKey : undefined,
        password: pin,
        confirmPassword: confirmPin,
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
          <p className="mt-2 text-gray-400">Import your existing wallet</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Import Method</label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setImportType('seed')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    importType === 'seed'
                      ? 'bg-solana-green text-white'
                      : 'bg-solana-dark text-gray-400'
                  }`}
                >
                  Seed Phrase
                </button>
                <button
                  type="button"
                  onClick={() => setImportType('private')}
                  className={`flex-1 py-2 px-4 rounded-lg ${
                    importType === 'private'
                      ? 'bg-solana-green text-white'
                      : 'bg-solana-dark text-gray-400'
                  }`}
                >
                  Private Key
                </button>
              </div>
            </div>

            {importType === 'seed' ? (
              <div>
                <label htmlFor="seedPhrase" className="block text-sm font-medium mb-2">
                  Seed Phrase
                </label>
                <textarea
                  id="seedPhrase"
                  value={seedPhrase}
                  onChange={(e) => setSeedPhrase(e.target.value)}
                  className="input-primary w-full h-24"
                  placeholder="Enter your 12 or 24-word seed phrase"
                  required
                />
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
              <label htmlFor="pin" className="block text-sm font-medium mb-2">
                PIN Code
              </label>
              <div className="flex justify-center">
                <PinInput
                  id="pin"
                  value={pin}
                  onChange={setPin}
                  error={!!error}
                  disabled={isLoading}
                  autoFocus={true}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPin" className="block text-sm font-medium mb-2">
                Confirm PIN
              </label>
              <div className="flex justify-center">
                <PinInput
                  id="confirmPin"
                  value={confirmPin}
                  onChange={setConfirmPin}
                  error={!!error}
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full flex justify-center items-center"
              disabled={isLoading || pin.length !== 6 || confirmPin.length !== 6}
            >
              {isLoading ? (
                <span className="inline-flex items-center">
                  Loading...
                </span>
              ) : (
                'Import Wallet'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}