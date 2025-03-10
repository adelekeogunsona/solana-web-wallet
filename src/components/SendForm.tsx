import { useState } from 'react';

const DUMMY_TOKENS = [
  { symbol: 'SOL', name: 'Solana', balance: 12.345 },
  { symbol: 'USDC', name: 'USD Coin', balance: 100.0 },
  { symbol: 'RAY', name: 'Raydium', balance: 50.0 },
];

export default function SendForm() {
  const [selectedToken, setSelectedToken] = useState(DUMMY_TOKENS[0].symbol);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Dummy submit - will be implemented later
    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="card">
      <h2 className="text-xl font-bold mb-6">Send</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Token</label>
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="input-primary w-full"
          >
            {DUMMY_TOKENS.map((token) => (
              <option key={token.symbol} value={token.symbol}>
                {token.name} ({token.symbol}) - Balance: {token.balance}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input-primary w-full"
              placeholder="0.00"
              step="any"
              required
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-solana-green hover:opacity-80"
              onClick={() => {
                const token = DUMMY_TOKENS.find(t => t.symbol === selectedToken);
                if (token) setAmount(token.balance.toString());
              }}
            >
              MAX
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Recipient Address</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input-primary w-full"
            placeholder="Enter Solana address"
            required
          />
        </div>

        <div className="pt-4 border-t border-gray-700">
          <div className="flex justify-between text-sm mb-4">
            <span className="text-gray-400">Network Fee</span>
            <span>~0.000005 SOL</span>
          </div>
          <button
            type="submit"
            className="btn-primary w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}