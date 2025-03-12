import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon } from '@heroicons/react/24/outline';

export function AddWalletButton() {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('/add-wallet');
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`flex items-center justify-center p-4 rounded-lg border-2 border-dashed
        ${isHovered
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-gray-300 dark:border-gray-700 text-gray-500 dark:text-gray-400'
        } transition-all duration-200 hover:border-primary hover:bg-primary/5 hover:text-primary`}
    >
      <div className="flex flex-col items-center space-y-2">
        <PlusIcon className="w-8 h-8" />
        <span className="text-sm font-medium">Add Wallet</span>
      </div>
    </button>
  );
}