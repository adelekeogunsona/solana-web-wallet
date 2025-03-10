import { useState } from 'react';
import SendForm from '../components/SendForm';
import ReceiveForm from '../components/ReceiveForm';

export default function Transfer() {
  const [activeTab, setActiveTab] = useState<'send' | 'receive'>('send');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Transfer</h1>

      <div className="mb-8">
        <div className="flex space-x-4 border-b border-gray-700">
          <button
            className={`pb-4 px-4 text-lg font-medium border-b-2 ${
              activeTab === 'send'
                ? 'border-solana-green text-solana-green'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('send')}
          >
            Send
          </button>
          <button
            className={`pb-4 px-4 text-lg font-medium border-b-2 ${
              activeTab === 'receive'
                ? 'border-solana-green text-solana-green'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
            onClick={() => setActiveTab('receive')}
          >
            Receive
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {activeTab === 'send' ? <SendForm /> : <ReceiveForm />}
      </div>
    </div>
  );
}