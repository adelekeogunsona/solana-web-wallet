import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ImportWalletParams } from '../context/authContextTypes';
import { generateRandomWalletName } from '../utils/wallet';

export function AddWalletImport() {
  const navigate = useNavigate();
  const { addWallet } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importType, setImportType] = useState<'seed' | 'private'>('seed');
  const [formData, setFormData] = useState({
    seedPhrase: '',
    privateKey: '',
    name: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const params: ImportWalletParams = {
        type: importType,
        seedPhrase: formData.seedPhrase,
        privateKey: formData.privateKey,
        name: formData.name || generateRandomWalletName(),
        password: '', // This will be handled by the context using the existing PIN
        confirmPassword: ''
      };

      await addWallet(params);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-md">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Import Wallet</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Import an existing wallet using seed phrase or private key
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Import Method</label>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setImportType('seed')}
                    className={`flex-1 py-2 px-4 rounded-md ${
                      importType === 'seed'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Seed Phrase
                  </button>
                  <button
                    type="button"
                    onClick={() => setImportType('private')}
                    className={`flex-1 py-2 px-4 rounded-md ${
                      importType === 'private'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Private Key
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Wallet Name (Optional)</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={handleInputChange('name')}
                  placeholder="My Wallet"
                  className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              {importType === 'seed' ? (
                <div>
                  <label className="block text-sm font-medium mb-2">Seed Phrase</label>
                  <textarea
                    value={formData.seedPhrase}
                    onChange={handleInputChange('seedPhrase')}
                    placeholder="Enter your 12 or 24 word seed phrase"
                    rows={3}
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-2">Private Key</label>
                  <input
                    type="password"
                    value={formData.privateKey}
                    onChange={handleInputChange('privateKey')}
                    placeholder="Enter your private key"
                    className="w-full px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => navigate('/add-wallet')}
                className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? 'Importing...' : 'Import Wallet'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}