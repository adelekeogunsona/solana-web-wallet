import { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/authContextTypes';
import { useToast } from '@/hooks/useToast';
import { rpcManager } from '../utils/rpc';
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { getKeypairFromPrivateKey } from '../utils/wallet';

interface SendFormProps {
  walletId?: string;
}

const LAMPORTS_PER_SIGNATURE = 5000; // Base fee per signature
const RENT_EXEMPT_MINIMUM = 890880; // Minimum balance for rent exemption (in lamports)
const SAFETY_MARGIN = 2; // Multiply gas fee by this for safety margin

export default function SendForm({ walletId }: SendFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { wallets } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | undefined>(undefined);
  const [estimatedFee, setEstimatedFee] = useState<number>(LAMPORTS_PER_SIGNATURE / LAMPORTS_PER_SOL);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isNewAccount, setIsNewAccount] = useState<boolean>(false);

  const wallet = wallets?.find(w => w.id === walletId);

  const validateRecipientAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      setRecipientError(null);
      return true;
    } catch {
      setRecipientError('Invalid Solana address');
      return false;
    }
  };

  const validateAmount = useCallback((amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }
    if (balance === undefined) {
      setAmountError('Unable to validate amount: balance unknown');
      return false;
    }

    const rentExemptCost = isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0;
    const totalCost = parsedAmount + estimatedFee + rentExemptCost;
    if (totalCost > balance) {
      setAmountError('Insufficient balance (including fees and rent-exempt minimum)');
      return false;
    }
    setAmountError(null);
    return true;
  }, [balance, estimatedFee, isNewAccount]);

  // Check if recipient account exists when address changes
  useEffect(() => {
    const checkRecipientAccount = async () => {
      if (!validateRecipientAddress(address)) return;

      try {
        const recipientBalance = await rpcManager.getBalance(address);
        const newIsNewAccount = recipientBalance === 0;
        setIsNewAccount(newIsNewAccount);

        // Re-validate amount when recipient status changes
        if (amount) {
          validateAmount(amount);
        }
      } catch (error) {
        console.error('Failed to check recipient account:', error);
      }
    };

    if (address) {
      checkRecipientAccount();
    }
  }, [address, amount, balance, estimatedFee, isNewAccount, validateAmount]);

  // Estimate transaction fee function
  const estimateTransactionFee = useCallback(async () => {
    if (!wallet) return;

    try {
      // Create a dummy transaction to estimate fees
      const recentBlockhash = await rpcManager.getRecentBlockhash();
      const transaction = new Transaction({ recentBlockhash });

      // Add transfer instruction
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: new PublicKey(wallet.publicKey),
          lamports: LAMPORTS_PER_SOL / 100,
        })
      );

      // If it's a new account, add second transfer instruction to simulate rent-exempt transfer
      if (isNewAccount) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: new PublicKey(wallet.publicKey),
            lamports: RENT_EXEMPT_MINIMUM,
          })
        );
      }

      const fee = await rpcManager.getFeeForMessage(transaction.compileMessage());
      if (fee !== null) {
        setEstimatedFee((fee * SAFETY_MARGIN) / LAMPORTS_PER_SOL);
      }
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      // Fallback to default fee estimate (double for new accounts)
      setEstimatedFee((LAMPORTS_PER_SIGNATURE * SAFETY_MARGIN * (isNewAccount ? 2 : 1)) / LAMPORTS_PER_SOL);
    }
  }, [wallet, isNewAccount]);

  // Fetch balance and estimate fee when wallet changes
  useEffect(() => {
    if (wallet) {
      rpcManager.getBalance(wallet.publicKey)
        .then(setBalance)
        .catch(error => {
          console.error('Failed to fetch balance:', error);
          toast({
            title: "Error",
            description: "Failed to fetch wallet balance",
            variant: "destructive",
          });
        });

      estimateTransactionFee();
    }
  }, [wallet, toast, estimateTransactionFee]);

  // Re-estimate fee when isNewAccount changes
  useEffect(() => {
    if (wallet) {
      estimateTransactionFee();
    }
  }, [wallet, isNewAccount, estimateTransactionFee]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      toast({
        title: "Error",
        description: "No wallet selected",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    const isValidAddress = validateRecipientAddress(address);
    const isValidAmount = validateAmount(amount);

    if (!isValidAddress || !isValidAmount) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleConfirmSend = async () => {
    if (!wallet) return;

    setIsLoading(true);
    try {
      // Get recent blockhash
      const recentBlockhash = await rpcManager.getRecentBlockhash();

      // Create transaction
      const transaction = new Transaction({ recentBlockhash }).add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(wallet.publicKey),
          toPubkey: new PublicKey(address),
          lamports: Math.floor(parseFloat(amount) * LAMPORTS_PER_SOL),
        })
      );

      // If it's a new account, add another instruction for rent-exempt minimum
      if (isNewAccount) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: new PublicKey(address),
            lamports: RENT_EXEMPT_MINIMUM,
          })
        );
      }

      // Get keypair from private key
      const keypair = getKeypairFromPrivateKey(wallet.privateKey);

      // Sign and send transaction
      transaction.sign(keypair);
      const signature = await rpcManager.sendTransaction(transaction);

      // Wait for confirmation
      try {
        await rpcManager.confirmTransaction(signature);
        toast({
          title: "Success",
          description: `Transaction sent successfully. Signature: ${signature.slice(0, 8)}...`,
        });
        navigate('/');
      } catch (error) {
        console.error('Transaction confirmation failed:', error);
        toast({
          title: "Warning",
          description: "Transaction sent but confirmation failed. Please check the transaction status.",
        });
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send transaction",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  const handleSetMaxAmount = () => {
    if (balance === undefined || balance <= estimatedFee) return;
    const rentExemptCost = isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0;
    const maxAmount = balance - estimatedFee - rentExemptCost;
    if (maxAmount <= 0) {
      setAmountError('Insufficient balance for fees and rent-exempt minimum');
      return;
    }
    setAmount(maxAmount.toFixed(9));
    validateAmount(maxAmount.toString());
  };

  if (!wallet) {
    return (
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Send</h2>
        <p className="text-red-500">No wallet selected</p>
      </div>
    );
  }

  return (
    <>
      <div className="card">
        <h2 className="text-xl font-bold mb-6">Send SOL</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">From</label>
            <div className="input-primary w-full p-2 flex justify-between items-center">
              <span>{wallet.name || 'Unnamed Wallet'}</span>
              <span className="text-gray-500">{balance !== undefined ? `${balance.toFixed(9)} SOL` : '...'}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <input
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  validateAmount(e.target.value);
                }}
                className={`input-primary w-full ${amountError ? 'border-red-500' : ''}`}
                placeholder="0.00"
                step="any"
                required
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-solana-green hover:opacity-80"
                onClick={handleSetMaxAmount}
                disabled={balance === undefined || balance <= estimatedFee}
              >
                MAX
              </button>
            </div>
            {amountError && (
              <p className="mt-1 text-sm text-red-500">{amountError}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Recipient Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                validateRecipientAddress(e.target.value);
              }}
              className={`input-primary w-full ${recipientError ? 'border-red-500' : ''}`}
              placeholder="Enter Solana address"
              required
            />
            {recipientError && (
              <p className="mt-1 text-sm text-red-500">{recipientError}</p>
            )}
          </div>

          <div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-400">Network Fee</span>
              <span>~{estimatedFee.toFixed(6)} SOL</span>
            </div>
            <button
              type="submit"
              className="btn-primary w-full"
              disabled={isLoading || balance === undefined || !!recipientError || !!amountError}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>
      </div>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4">Confirm Transaction</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <p className="font-medium">{amount} SOL</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">To</p>
                <p className="font-medium break-all">{address}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Network Fee</p>
                <p className="font-medium">{estimatedFee.toFixed(6)} SOL</p>
              </div>
              {isNewAccount && (
                <div>
                  <p className="text-sm text-gray-500">Rent-exempt Minimum</p>
                  <p className="font-medium">{(RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">Total</p>
                <p className="font-medium">
                  {(parseFloat(amount) + estimatedFee + (isNewAccount ? RENT_EXEMPT_MINIMUM / LAMPORTS_PER_SOL : 0)).toFixed(9)} SOL
                </p>
              </div>
            </div>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 btn-secondary"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSend}
                className="flex-1 btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}