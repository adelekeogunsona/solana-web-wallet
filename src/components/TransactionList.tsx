interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  token: string;
  address: string;
  timestamp: string;
  status: 'confirmed' | 'pending' | 'failed';
}

const DUMMY_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    type: 'send',
    amount: 1.5,
    token: 'SOL',
    address: '7x8x9x0x1x2x3x4x5x6x7x8x9x0x1x2x',
    timestamp: '2024-03-10T15:30:00Z',
    status: 'confirmed'
  },
  {
    id: '2',
    type: 'receive',
    amount: 0.5,
    token: 'SOL',
    address: '1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6x',
    timestamp: '2024-03-10T14:20:00Z',
    status: 'confirmed'
  },
  {
    id: '3',
    type: 'send',
    amount: 2.0,
    token: 'SOL',
    address: '3x4x5x6x7x8x9x0x1x2x3x4x5x6x7x8x',
    timestamp: '2024-03-10T12:15:00Z',
    status: 'pending'
  }
];

export default function TransactionList() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Recent Transactions</h2>
        <button className="text-sm text-solana-green hover:opacity-80">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {DUMMY_TRANSACTIONS.map((tx) => (
          <div key={tx.id} className="card hover:border-solana-purple cursor-pointer transition-all">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  tx.type === 'send' ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'
                }`}>
                  {tx.type === 'send' ? '↑' : '↓'}
                </div>
                <div>
                  <p className="font-medium">{tx.type === 'send' ? 'Sent' : 'Received'}</p>
                  <p className="text-sm text-gray-400">
                    {tx.address.slice(0, 4)}...{tx.address.slice(-4)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-medium ${
                  tx.type === 'send' ? 'text-red-500' : 'text-green-500'
                }`}>
                  {tx.type === 'send' ? '-' : '+'}{tx.amount} {tx.token}
                </p>
                <p className="text-sm text-gray-400">
                  {new Date(tx.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-700">
              <span className={`text-xs px-2 py-1 rounded ${
                tx.status === 'confirmed' ? 'bg-green-500/10 text-green-500' :
                tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                'bg-red-500/10 text-red-500'
              }`}>
                {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}