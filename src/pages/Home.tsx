import { Link } from 'react-router-dom';
import WalletCard from '../components/WalletCard';
import TokenCard from '../components/TokenCard';
import TransactionList from '../components/TransactionList';

const DUMMY_WALLETS = [
  { id: 1, name: 'Main Wallet', address: '7x8x9x0x1x2x3x4x5x6x7x8x9x0x1x2x', balance: 12.345 },
  { id: 2, name: 'Trading Wallet', address: '1x2x3x4x5x6x7x8x9x0x1x2x3x4x5x6x', balance: 5.678 },
];

const DUMMY_TOKENS = [
  { id: 1, name: 'Serum', symbol: 'SRM', balance: 1000 },
  { id: 2, name: 'Raydium', symbol: 'RAY', balance: 500 },
  { id: 3, name: 'Star Atlas', symbol: 'ATLAS', balance: 2500 },
];

export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Wallets</h1>
          <div className="space-x-4">
            <Link to="/transfer" className="btn-primary">
              Send / Receive
            </Link>
            <button className="btn-secondary">
              Add New Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DUMMY_WALLETS.map((wallet) => (
            <WalletCard
              key={wallet.id}
              name={wallet.name}
              address={wallet.address}
              balance={wallet.balance}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-6">Tokens</h2>
          <div className="space-y-4">
            {DUMMY_TOKENS.map((token) => (
              <TokenCard
                key={token.id}
                name={token.name}
                symbol={token.symbol}
                balance={token.balance}
              />
            ))}
          </div>
        </div>

        <div>
          <TransactionList />
        </div>
      </div>
    </div>
  );
}