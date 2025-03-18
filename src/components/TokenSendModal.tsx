import { useState, useContext, useEffect, useCallback } from 'react';
import { AuthContext } from '../context/authContextTypes';
import { useToast } from '@/hooks/useToast';
import { rpcManager } from '../utils/rpc';
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  SystemProgram
} from '@solana/web3.js';
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddress,
  createTransferInstruction,
  TOKEN_PROGRAM_ID
} from '@solana/spl-token';
import { getKeypairFromPrivateKey } from '../utils/wallet';
import { TokenData } from '@/hooks/useTokens';

interface TokenSendModalProps {
  walletId?: string;
  token: TokenData;
  isOpen: boolean;
  onClose: () => void;
}

// Safety margin for transaction fees to account for potential blockchain congestion
const SAFETY_MARGIN = 2;

export default function TokenSendModal({
  walletId,
  token,
  isOpen,
  onClose
}: TokenSendModalProps) {
  const { toast } = useToast();
  const { wallets } = useContext(AuthContext);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [estimatedFee, setEstimatedFee] = useState<number>(0.000005); // Initial estimate of 5000 lamports
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recipientError, setRecipientError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);
  const [isAddressValid, setIsAddressValid] = useState(false);
  const [sourceTokenAccount, setSourceTokenAccount] = useState<string | null>(null);
  const [rentExemption, setRentExemption] = useState<number>(2500000); // Default value, updated dynamically
  const [needsAccountCreation, setNeedsAccountCreation] = useState<boolean>(false);
  const [needsWalletFunding, setNeedsWalletFunding] = useState<boolean>(false);
  const [walletFundingAmount] = useState<number>(890880); // Default minimum SOL for a wallet

  const wallet = wallets?.find(w => w.id === walletId);

  // Reset form when opened or token changes
  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setAddress('');
      setAmountError(null);
      setRecipientError(null);
      setIsAddressValid(false);
      setShowConfirmation(false);
    }
  }, [isOpen, token.mint]);

  // Fetch source token account when component mounts or token changes
  useEffect(() => {
    const fetchSourceTokenAccount = async () => {
      if (!wallet || !isOpen) return;

      try {
        const tokenAccounts = await rpcManager.getTokenAccounts(wallet.publicKey);
        const sourceAccount = tokenAccounts.find(acc => acc.mint === token.mint);

        if (sourceAccount) {
          setSourceTokenAccount(sourceAccount.pubkey.toString());
        } else {
          toast({
            title: "Error",
            description: "Token account not found",
            variant: "destructive",
          });
          onClose();
        }
      } catch (error) {
        console.error('Failed to fetch token accounts:', error);
        toast({
          title: "Error",
          description: "Failed to fetch token accounts",
          variant: "destructive",
        });
        onClose();
      }
    };

    if (isOpen) {
      fetchSourceTokenAccount();
    }
  }, [wallet, token.mint, toast, onClose, isOpen]);

  // Estimate network fee
  useEffect(() => {
    const fetchRentExemption = async () => {
      if (!wallet || !isOpen) return;

      try {
        // Get the rent exemption for token accounts (size is 165 bytes)
        const tokenAccountSize = 165;
        const tokenAccountRent = await rpcManager.getMinimumBalanceForRentExemption(tokenAccountSize);
        setRentExemption(tokenAccountRent);
      } catch (error) {
        console.error('Failed to fetch rent exemption:', error);
        // Default value for token account rent
        setRentExemption(2500000);
      }
    };

    if (isOpen) {
      fetchRentExemption();
    }
  }, [wallet, isOpen]);

  const validateRecipientAddress = async (address: string): Promise<boolean> => {
    // Clear amount when address changes
    setAmount('');
    setAmountError(null);

    try {
      // Validate address format
      const recipientPublicKey = new PublicKey(address);
      setRecipientError(null);

      try {
        // Check if recipient has any SOL balance
        const recipientBalance = await rpcManager.getBalance(recipientPublicKey.toString());
        const recipientHasNoSol = recipientBalance === 0;
        setNeedsWalletFunding(recipientHasNoSol);
        console.log(`Recipient wallet funding needed: ${recipientHasNoSol}`);

        // Check if the destination address is a token account for this mint
        const mintPublicKey = new PublicKey(token.mint);

        // Derive the associated token account address
        const destinationTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey
        );

        // Check if this token account exists
        const accountInfo = await rpcManager.getAccountInfo(destinationTokenAccount.toString());

        // Update state based on whether we need to create an account
        const accountNeedsCreation = !accountInfo;
        setNeedsAccountCreation(accountNeedsCreation);

        // Update the fee estimation for all required operations
        updateFeeEstimation(accountNeedsCreation, recipientHasNoSol);

        setIsAddressValid(true);
        return true;
      } catch (error) {
        console.error('Error checking recipient details:', error);
        // Even if there's an error, we'll still allow the transaction
        // The error handling during send will catch any issues
        setIsAddressValid(true);
        // Assume we need to create an account to be safe
        setNeedsAccountCreation(true);
        setNeedsWalletFunding(true);
        updateFeeEstimation(true, true);
        return true;
      }
    } catch {
      setRecipientError('Invalid Solana address');
      setIsAddressValid(false);
      return false;
    }
  };

  // Update the fee estimation method to include wallet funding if needed
  const updateFeeEstimation = async (
    needsAccountCreation: boolean,
    needsWalletFunding: boolean
  ): Promise<void> => {
    if (!wallet) return;

    try {
      // Get recent blockhash
      const recentBlockhash = await rpcManager.getRecentBlockhash();

      // Create a dummy transaction to estimate fee
      const dummyTx = new Transaction({ recentBlockhash });

      // Set fee payer
      dummyTx.feePayer = new PublicKey(wallet.publicKey);

      // Create a dummy recipient for our estimations
      const dummyRecipient = new PublicKey(wallet.publicKey);
      const dummyMint = new PublicKey(token.mint);
      const dummyAssociatedAccount = await getAssociatedTokenAddress(dummyMint, dummyRecipient);

      // If we need to fund the recipient wallet, add that instruction
      if (needsWalletFunding) {
        dummyTx.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: dummyRecipient,
            lamports: walletFundingAmount
          })
        );
      }

      // If creating an account, add a create instruction
      if (needsAccountCreation) {
        dummyTx.add(
          createAssociatedTokenAccountInstruction(
            new PublicKey(wallet.publicKey),
            dummyAssociatedAccount,
            dummyRecipient,
            dummyMint
          )
        );
      }

      // Add a transfer instruction
      if (sourceTokenAccount) {
        dummyTx.add(
          createTransferInstruction(
            new PublicKey(sourceTokenAccount),
            dummyAssociatedAccount,
            new PublicKey(wallet.publicKey),
            1  // Just transfer 1 token unit for estimation
          )
        );
      } else {
        // Fallback to SOL transfer if we don't have a source token account yet
        dummyTx.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: new PublicKey(wallet.publicKey),
            lamports: 1000,
          })
        );
      }

      // Get fee estimate
      const fee = await rpcManager.getFeeForMessage(dummyTx.compileMessage());

      // Calculate total with rent exemption and wallet funding if needed
      const estimatedTotal = (fee * SAFETY_MARGIN) +
                            (needsAccountCreation ? rentExemption : 0) +
                            (needsWalletFunding ? walletFundingAmount : 0);

      // Update estimated fee display
      setEstimatedFee(estimatedTotal / LAMPORTS_PER_SOL);
    } catch (error) {
      console.error('Failed to update fee estimation:', error);
      // Use fallback estimates
      const defaultFee = 5000 * SAFETY_MARGIN;
      const estimatedTotal = defaultFee +
                            (needsAccountCreation ? rentExemption : 0) +
                            (needsWalletFunding ? walletFundingAmount : 0);
      setEstimatedFee(estimatedTotal / LAMPORTS_PER_SOL);
    }
  };

  const validateAmount = useCallback((amount: string): boolean => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Amount must be greater than 0');
      return false;
    }

    if (parsedAmount > token.balance) {
      setAmountError('Insufficient token balance');
      return false;
    }

    setAmountError(null);
    return true;
  }, [token.balance]);

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
    if (!isAddressValid) {
      setRecipientError('Please enter a valid recipient address');
      return;
    }

    const isValidAmount = validateAmount(amount);
    if (!isValidAmount) {
      return;
    }

    // Show confirmation dialog
    setShowConfirmation(true);
  };

  const handleSetMaxAmount = () => {
    if (!isAddressValid) return;

    setAmount(token.balance.toString());
    validateAmount(token.balance.toString());
  };

  const handleConfirmSend = async () => {
    if (!wallet || !isAddressValid || !sourceTokenAccount) return;

    setIsLoading(true);
    try {
      // Check wallet SOL balance first to ensure we have enough for rent
      const solBalance = await rpcManager.getBalance(wallet.publicKey);
      const solBalanceInLamports = solBalance * LAMPORTS_PER_SOL;

      // Get recipient public key
      const recipientPublicKey = new PublicKey(address);

      // Create transaction
      const recentBlockhash = await rpcManager.getRecentBlockhash();
      const transaction = new Transaction({ recentBlockhash });

      // Explicitly set the fee payer for the transaction
      transaction.feePayer = new PublicKey(wallet.publicKey);

      // Check if the recipient wallet needs funding
      const recipientBalance = await rpcManager.getBalance(recipientPublicKey.toString());
      const recipientNeedsFunding = recipientBalance === 0;
      setNeedsWalletFunding(recipientNeedsFunding);

      // If wallet needs funding, add transfer instruction
      let walletFundingCost = 0;
      if (recipientNeedsFunding) {
        walletFundingCost = walletFundingAmount;
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: new PublicKey(wallet.publicKey),
            toPubkey: recipientPublicKey,
            lamports: walletFundingAmount
          })
        );
      }

      // Check if the destination already has a token account for this mint
      let destinationTokenAccount: PublicKey;
      let accountCreationCost = 0;

      try {
        // Get the associated token address for the recipient
        const mintPublicKey = new PublicKey(token.mint);
        console.log(`Using mint address: ${mintPublicKey.toString()}`);
        console.log(`Using recipient address: ${recipientPublicKey.toString()}`);

        // Use explicit options to ensure proper derivation
        destinationTokenAccount = await getAssociatedTokenAddress(
          mintPublicKey,
          recipientPublicKey,
          false,           // allowOwnerOffCurve: false is default and safer
          TOKEN_PROGRAM_ID // Explicitly specify the token program ID
        );

        console.log(`Associated token account address: ${destinationTokenAccount.toString()}`);

        // Check if account exists
        const accountInfo = await rpcManager.getAccountInfo(destinationTokenAccount.toString());
        console.log(`Token account exists: ${!!accountInfo}`);

        // Update state if needed (in case something changed since validation)
        if (!accountInfo) {
          console.log("Creating associated token account for recipient");
          setNeedsAccountCreation(true);
          accountCreationCost = rentExemption;

          try {
            // Add instruction to create associated token account
            transaction.add(
              createAssociatedTokenAccountInstruction(
                new PublicKey(wallet.publicKey), // payer
                destinationTokenAccount,         // associated token account address
                recipientPublicKey,              // owner
                mintPublicKey,                   // mint
                TOKEN_PROGRAM_ID                 // explicitly specify token program
              )
            );
            console.log("Added token account creation instruction successfully");
          } catch (createAccountError: unknown) {
            console.error("Error creating token account instruction:", createAccountError);
            throw new Error(`Token account creation instruction failed: ${createAccountError instanceof Error ? createAccountError.message : String(createAccountError)}`);
          }
        } else {
          setNeedsAccountCreation(false);
          console.log("Found existing token account, no need to create");
        }

        // Add token transfer instruction
        try {
          // Convert amount to the smallest unit based on decimals
          const adjustedAmount = Math.floor(parseFloat(amount) * Math.pow(10, token.decimals));
          console.log(`Token transfer: ${adjustedAmount} raw units (${amount} ${token.symbol})`);
          console.log(`Source token account: ${sourceTokenAccount}`);
          console.log(`Destination token account: ${destinationTokenAccount.toString()}`);
          console.log(`Authority (wallet): ${wallet.publicKey}`);

          // Create the transfer instruction with better error handling
          // First verify the source token account exists and has balance
          const sourceTokenPubkey = new PublicKey(sourceTokenAccount);

          console.log(`Verifying source token account ${sourceTokenAccount}`);
          const sourceAccountInfo = await rpcManager.getAccountInfo(sourceTokenAccount);
          if (!sourceAccountInfo) {
            throw new Error(`Source token account ${sourceTokenAccount} not found`);
          }
          console.log(`Source token account verified, exists on chain`);

          // Create the transfer instruction with proper error handling
          try {
            const transferInstruction = createTransferInstruction(
              sourceTokenPubkey,            // source
              destinationTokenAccount,      // destination
              new PublicKey(wallet.publicKey),  // owner/authority
              adjustedAmount,               // amount (in raw units)
              [],                           // multiSigners (empty array)
              TOKEN_PROGRAM_ID              // programId
            );
            transaction.add(transferInstruction);
            console.log("Added token transfer instruction successfully");
          } catch (err) {
            console.error("Error in createTransferInstruction:", err);
            // Try alternative approach without optional parameters
            const basicTransferInstruction = createTransferInstruction(
              sourceTokenPubkey,                // source
              destinationTokenAccount,          // destination
              new PublicKey(wallet.publicKey),  // owner/authority
              adjustedAmount                    // amount (in raw units)
            );
            transaction.add(basicTransferInstruction);
            console.log("Added basic token transfer instruction successfully");
          }

          // Get the transaction cost
          const message = transaction.compileMessage();
          const fee = await rpcManager.getFeeForMessage(message);

          // Calculate total cost (fee + rent if creating account + wallet funding)
          const totalCostInLamports = (fee * SAFETY_MARGIN) + accountCreationCost + walletFundingCost;

          // Log the final transaction details
          console.log(`Transaction has ${transaction.instructions.length} instructions`);
          console.log(`Transaction signature count: ${transaction.signatures.length}`);
          console.log(`Estimated fee: ${fee} lamports (with safety margin: ${fee * SAFETY_MARGIN})`);
          console.log(`Account creation cost: ${accountCreationCost} lamports`);
          console.log(`Wallet funding cost: ${walletFundingCost} lamports`);
          console.log(`Total cost: ${totalCostInLamports} lamports (${totalCostInLamports / LAMPORTS_PER_SOL} SOL)`);
          console.log(`Wallet SOL balance: ${solBalanceInLamports} lamports (${solBalance} SOL)`);

          // Now check if we have enough SOL balance
          if (solBalanceInLamports < totalCostInLamports) {
            throw new Error(`Insufficient SOL balance. Need ${(totalCostInLamports / LAMPORTS_PER_SOL).toFixed(6)} SOL for fees, have ${solBalance.toFixed(6)} SOL`);
          }

          // Get keypair from private key
          console.log("Creating signer from private key");
          const keypair = getKeypairFromPrivateKey(wallet.privateKey);

          // Sign and send transaction
          console.log("Signing transaction");
          transaction.sign(keypair);

          console.log("Sending transaction to the network");
          const signature = await rpcManager.sendTransaction(transaction);
          console.log(`Transaction sent with signature: ${signature}`);

          // Show success toast
          let successMessage = 'Token transfer successful';
          if (needsAccountCreation && needsWalletFunding) {
            successMessage += '. Created new wallet and token account for recipient.';
          } else if (needsAccountCreation) {
            successMessage += '. Created new token account for recipient.';
          } else if (needsWalletFunding) {
            successMessage += '. Funded recipient wallet.';
          }

          toast({
            title: "Success",
            description: successMessage,
          });

          // Open explorer in new tab
          window.open(`https://solana.fm/tx/${signature}?cluster=mainnet-beta`, '_blank');

          // Close the form and go back
          onClose();

          // Return early to avoid the outer catch block
          return;
        } catch (error: unknown) {
          console.error('Transaction processing error:', error);
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to process token transaction: ${errorMessage}`);
        }
      } catch (error) {
        console.error('Error with token account or transaction:', error);
        throw new Error(error instanceof Error ? error.message : "Failed to process token account");
      }
    } catch (error) {
      console.error('Transaction failed:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send tokens",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setShowConfirmation(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Send {token.symbol}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showConfirmation ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">From</label>
                <div className="input-primary w-full p-2 flex justify-between items-center">
                  <span>{wallet?.name || 'Unnamed Wallet'}</span>
                  <span className="text-gray-500">{token.balance.toFixed(token.decimals)} {token.symbol}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Recipient Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    setIsAddressValid(false); // Reset validity on change
                  }}
                  onBlur={() => address && validateRecipientAddress(address)}
                  className={`input-primary w-full ${recipientError ? 'border-red-500' : ''}`}
                  placeholder="Enter Solana address"
                  required
                />
                {recipientError && (
                  <p className="mt-1 text-sm text-red-500">{recipientError}</p>
                )}
                {isAddressValid && (
                  <p className="mt-1 text-sm text-green-500">Valid address</p>
                )}
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
                    disabled={!isAddressValid}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-solana-green hover:opacity-80"
                    onClick={handleSetMaxAmount}
                    disabled={!isAddressValid}
                  >
                    MAX
                  </button>
                </div>
                {amountError && (
                  <p className="mt-1 text-sm text-red-500">{amountError}</p>
                )}
              </div>

              <div>
                <div className="flex justify-between text-sm mb-4">
                  <span className="text-gray-400">Network Fee</span>
                  <span>~{estimatedFee.toFixed(6)} SOL</span>
                </div>
                {needsAccountCreation && (
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-400">Account Creation Cost</span>
                    <span>{(rentExemption / LAMPORTS_PER_SOL).toFixed(6)} SOL</span>
                  </div>
                )}
                {needsWalletFunding && (
                  <div className="flex justify-between text-sm mb-4">
                    <span className="text-gray-400">Wallet Funding Cost</span>
                    <span>{(walletFundingAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL</span>
                  </div>
                )}
                <button
                  type="submit"
                  className="btn-primary w-full"
                  disabled={isLoading || !isAddressValid || !!amountError || amount === ''}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-medium">{amount} {token.symbol}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">To</p>
                  <p className="font-medium break-all">{address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Network Fee</p>
                  <p className="font-medium">{estimatedFee.toFixed(6)} SOL</p>
                </div>
                {needsAccountCreation && (
                  <div>
                    <p className="text-sm text-gray-500">Account Creation Cost</p>
                    <p className="font-medium">{(rentExemption / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  </div>
                )}
                {needsWalletFunding && (
                  <div>
                    <p className="text-sm text-gray-500">Wallet Funding Cost</p>
                    <p className="font-medium">{(walletFundingAmount / LAMPORTS_PER_SOL).toFixed(6)} SOL</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 btn-secondary"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  onClick={handleConfirmSend}
                  className="flex-1 btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Confirm Send'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}