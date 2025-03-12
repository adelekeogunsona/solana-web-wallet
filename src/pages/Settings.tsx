import { useState } from 'react';
import { useSettings } from '../hooks/useSettings';

export default function Settings() {
  const { settings, addRpcEndpoint, removeRpcEndpoint, setBalanceReloadInterval } = useSettings();
  const [newRpcEndpoint, setNewRpcEndpoint] = useState('');

  const handleAddRpc = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRpcEndpoint.trim()) {
      addRpcEndpoint(newRpcEndpoint.trim());
      setNewRpcEndpoint('');
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
              <select className="input-primary w-full">
                <option value="5">5 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Master Password</label>
              <button className="btn-secondary">Change Password</button>
            </div>
          </div>
        </section>

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
                <form onSubmit={handleAddRpc} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newRpcEndpoint}
                    onChange={(e) => setNewRpcEndpoint(e.target.value)}
                    placeholder="Enter RPC endpoint URL (e.g., https://your-rpc-endpoint)"
                    className="input-primary flex-grow"
                  />
                  <button
                    type="submit"
                    className="btn-primary px-3 py-2"
                    disabled={!newRpcEndpoint.trim()}
                  >
                    Add
                  </button>
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