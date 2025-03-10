import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Dummy recovery phrase
const DUMMY_RECOVERY_PHRASE = 'abandon ability able about above absent absorb abstract absurd abuse access accident';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfirmedPhrase, setHasConfirmedPhrase] = useState(false);
  const { initializeWallet } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await initializeWallet(password, confirmPassword);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create wallet');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhraseConfirmed = () => {
    setHasConfirmedPhrase(true);
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-solana-green">Welcome to Solana Wallet</h1>
          <p className="mt-2 text-gray-400">
            {step === 1 ? 'Create your master password' : 'Save your recovery phrase'}
          </p>
        </div>

        <div className="card">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
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
                {error && (
                  <p className="mt-2 text-sm text-red-500">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="btn-primary w-full flex justify-center items-center"
                disabled={isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Wallet'}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Recovery Phrase
                </label>
                <div className="bg-solana-dark p-4 rounded-lg">
                  <p className="text-sm font-mono break-all">
                    {DUMMY_RECOVERY_PHRASE}
                  </p>
                </div>
                <p className="mt-2 text-sm text-red-500">
                  Warning: Never share your recovery phrase with anyone!
                </p>
              </div>

              <div className="flex items-center">
                <input
                  id="confirm"
                  type="checkbox"
                  className="h-4 w-4 text-solana-green rounded border-gray-600 focus:ring-solana-green"
                  checked={hasConfirmedPhrase}
                  onChange={(e) => setHasConfirmedPhrase(e.target.checked)}
                />
                <label htmlFor="confirm" className="ml-2 block text-sm">
                  I have safely stored my recovery phrase
                </label>
              </div>

              <button
                onClick={handlePhraseConfirmed}
                className="btn-primary w-full"
                disabled={!hasConfirmedPhrase}
              >
                Continue to Wallet
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}