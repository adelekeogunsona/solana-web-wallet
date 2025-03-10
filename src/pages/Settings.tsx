export default function Settings() {
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
            <div>
              <label className="block text-sm font-medium mb-2">RPC Endpoint</label>
              <input
                type="text"
                className="input-primary w-full"
                placeholder="https://api.mainnet-beta.solana.com"
              />
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