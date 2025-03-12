import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../hooks/useAuth';
import PinInput from '../components/PinInput';
import { validateAndCheckRPCHealth } from '../utils/rpcValidation';

export default function Settings() {
  const { settings, addRpcEndpoint, removeRpcEndpoint, setBalanceReloadInterval, setAutoLogoutDuration } = useSettings();
  const { changePin } = useAuth();
  const [showPinChange, setShowPinChange] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newRpcEndpoint, setNewRpcEndpoint] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleAddRpc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRpcEndpoint.trim()) return;

    setIsValidating(true);
    setValidationError(null);

    try {
      const result = await validateAndCheckRPCHealth(newRpcEndpoint.trim());

      if (!result.isValid) {
        setValidationError(result.error || 'Invalid RPC endpoint');
        return;
      }

      if (!result.isHealthy) {
        setValidationError(result.error || 'RPC endpoint is not responding');
        return;
      }

      addRpcEndpoint(newRpcEndpoint.trim());
      setNewRpcEndpoint('');
      setValidationError(null);
    } catch (error) {
      setValidationError(error instanceof Error ? error.message : 'Failed to validate RPC endpoint');
    } finally {
      setIsValidating(false);
    }
  };

  const handlePinChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Validate new PIN
      if (newPin !== confirmNewPin) {
        throw new Error('New PINs do not match');
      }
      if (newPin.length !== 6 || !/^\d{6}$/.test(newPin)) {
        throw new Error('PIN must be exactly 6 digits');
      }

      // Change PIN
      await changePin(currentPinInput, newPin);

      setSuccess('PIN changed successfully');
      setShowPinChange(false);
      setCurrentPinInput('');
      setNewPin('');
      setConfirmNewPin('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change PIN');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <div className="space-y-8">
        {/* Security Settings */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Security</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Auto-logout Duration</label>
              <select
                className="input-primary w-full"
                value={settings.autoLogoutDuration}
                onChange={(e) => setAutoLogoutDuration(Number(e.target.value))}
              >
                <option value={300000}>5 minutes</option>
                <option value={900000}>15 minutes</option>
                <option value={1800000}>30 minutes</option>
                <option value={3600000}>1 hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">PIN Code</label>
              <button
                className="btn-secondary"
                onClick={() => setShowPinChange(true)}
              >
                Change PIN
              </button>
            </div>
          </div>
        </section>

        {/* PIN Change Modal */}
        {showPinChange && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="card max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Change PIN</h3>
              <form onSubmit={handlePinChange} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Current PIN</label>
                  <div className="flex justify-center">
                    <PinInput
                      value={currentPinInput}
                      onChange={setCurrentPinInput}
                      error={!!error}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">New PIN</label>
                  <div className="flex justify-center">
                    <PinInput
                      value={newPin}
                      onChange={setNewPin}
                      error={!!error}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New PIN</label>
                  <div className="flex justify-center">
                    <PinInput
                      value={confirmNewPin}
                      onChange={setConfirmNewPin}
                      error={!!error}
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm">{error}</p>
                )}
                {success && (
                  <p className="text-green-500 text-sm">{success}</p>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPinChange(false);
                      setCurrentPinInput('');
                      setNewPin('');
                      setConfirmNewPin('');
                      setError('');
                      setSuccess('');
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary flex-1"
                    disabled={
                      currentPinInput.length !== 6 ||
                      newPin.length !== 6 ||
                      confirmNewPin.length !== 6
                    }
                  >
                    Change PIN
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Network Settings */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Network</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Network</label>
              <select className="input-primary w-full">
                <option value="mainnet">Mainnet</option>
                <option value="testnet">Testnet</option>
                <option value="devnet">Devnet</option>
              </select>
            </div>

            {/* RPC Endpoints */}
            <div>
              <label className="block text-sm font-medium mb-2">RPC Endpoints</label>
              <p className="text-sm text-gray-400 mb-4">
                Add your own RPC endpoints. You can get them from providers like Alchemy, QuickNode, or run your own node.
                {settings.rpcEndpoints.length === 0 && (
                  <span className="text-red-500 block mt-1">
                    ⚠️ At least one RPC endpoint is required for the wallet to function.
                  </span>
                )}
              </p>
              <div className="space-y-2">
                {settings.rpcEndpoints.map((endpoint, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={endpoint}
                      readOnly
                      className="input-primary flex-grow"
                    />
                    <button
                      onClick={() => removeRpcEndpoint(endpoint)}
                      className="btn-secondary px-3 py-2"
                      disabled={settings.rpcEndpoints.length <= 1}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <form onSubmit={handleAddRpc} className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={newRpcEndpoint}
                      onChange={(e) => {
                        setNewRpcEndpoint(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="Enter RPC endpoint URL (e.g., https://your-rpc-endpoint)"
                      className={`input-primary flex-grow ${validationError ? 'border-red-500' : ''}`}
                      disabled={isValidating}
                    />
                    <button
                      type="submit"
                      className="btn-primary px-3 py-2"
                      disabled={!newRpcEndpoint.trim() || isValidating}
                    >
                      {isValidating ? 'Validating...' : 'Add'}
                    </button>
                  </div>
                  {validationError && (
                    <p className="text-sm text-red-500">{validationError}</p>
                  )}
                </form>
              </div>
            </div>

            {/* Balance Reload Interval */}
            <div>
              <label className="block text-sm font-medium mb-2">Balance Reload Interval</label>
              <select
                className="input-primary w-full"
                value={settings.balanceReloadInterval}
                onChange={(e) => setBalanceReloadInterval(Number(e.target.value))}
              >
                <option value={10000}>10 seconds</option>
                <option value={20000}>20 seconds</option>
                <option value={30000}>30 seconds</option>
                <option value={60000}>1 minute</option>
              </select>
            </div>
          </div>
        </section>

        {/* Appearance Settings */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Appearance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select className="input-primary w-full">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </section>

        {/* Backup & Recovery */}
        <section className="card">
          <h2 className="text-xl font-bold mb-4">Backup & Recovery</h2>
          <div className="space-y-4">
            <button className="btn-secondary">Export Encrypted Backup</button>
            <button className="btn-secondary">View Recovery Phrase</button>
          </div>
        </section>
      </div>
    </div>
  );
}