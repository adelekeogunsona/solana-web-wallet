import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Setup() {
  const [step, setStep] = useState(1);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasConfirmedPhrase, setHasConfirmedPhrase] = useState(false);
  const [recoveryPhrase, setRecoveryPhrase] = useState('');
  const { initializeWallet } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // When moving to step 2, get the recovery phrase from localStorage
    if (step === 2) {
      const walletData = localStorage.getItem('temp_wallet_data');
      if (walletData) {
        const { mnemonic } = JSON.parse(walletData);
        setRecoveryPhrase(mnemonic);
        // Clear the temporary data
        localStorage.removeItem('temp_wallet_data');
      }
    }
  }, [step]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'pin' | 'confirm') => {
    const value = e.target.value;
    // Only allow numbers and limit to 6 digits
    if (/^\d{0,6}$/.test(value)) {
      if (field === 'pin') {
        setPin(value);
      } else {
        setConfirmPin(value);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await initializeWallet(pin, confirmPin);
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
            {step === 1 ? 'Create your 6-digit PIN' : 'Save your recovery phrase'}
          </p>
        </div>

        <div className="card">
          {step === 1 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="pin" className="block text-sm font-medium mb-2">
                  PIN Code
                </label>
                <input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => handlePinChange(e, 'pin')}
                  className="input-primary w-full text-center text-2xl tracking-widest"
                  placeholder="••••••"
                  required
                />
                <p className="mt-2 text-sm text-gray-400">
                  PIN must be exactly 6 digits
                </p>
              </div>

              <div>
                <label htmlFor="confirmPin" className="block text-sm font-medium mb-2">
                  Confirm PIN
                </label>
                <input
                  id="confirmPin"
                  type="password"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={confirmPin}
                  onChange={(e) => handlePinChange(e, 'confirm')}
                  className="input-primary w-full text-center text-2xl tracking-widest"
                  placeholder="••••••"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                className="btn-primary w-full flex justify-center items-center"
                disabled={isLoading || pin.length !== 6 || confirmPin.length !== 6}
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
                    {recoveryPhrase}
                  </p>
                </div>
                <p className="mt-2 text-sm text-red-500">
                  Warning: Never share your recovery phrase with anyone!
                </p>
                <p className="mt-2 text-sm text-gray-400">
                  Write down these words in the correct order and store them in a secure location.
                  You will need them to recover your wallet if you lose access.
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