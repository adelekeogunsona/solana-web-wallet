import { Buffer } from 'buffer';
import { Keypair } from '@solana/web3.js';
import { mnemonicToSeedSync, generateMnemonic } from 'bip39';
import { derivePath } from 'ed25519-hd-key';

// Polyfill Buffer
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

// Constants
const DERIVATION_PATH = "m/44'/501'/0'/0'";

// Helper function to convert hex string to Uint8Array
function hexToUint8Array(hexString: string): Uint8Array {
  return new Uint8Array(
    hexString.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []
  );
}

// Helper function to convert Uint8Array to hex string
export function uint8ArrayToHex(arr: Uint8Array): string {
  return Array.from(arr)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generate a new mnemonic phrase and keypair
export function generateNewWallet(): { mnemonic: string; keypair: Keypair } {
  const mnemonic = generateMnemonic(256); // 24 words
  const keypair = getKeypairFromMnemonic(mnemonic);
  return { mnemonic, keypair };
}

// Import wallet from mnemonic phrase
export function getKeypairFromMnemonic(mnemonic: string): Keypair {
  const seed = mnemonicToSeedSync(mnemonic);
  const derivedSeed = derivePath(DERIVATION_PATH, seed.toString('hex')).key;
  return Keypair.fromSeed(derivedSeed);
}

// Import wallet from private key
export function getKeypairFromPrivateKey(privateKeyString: string): Keypair {
  try {
    const privateKeyBytes = hexToUint8Array(privateKeyString);
    return Keypair.fromSecretKey(privateKeyBytes);
  } catch (error) {
    throw new Error('Invalid private key format: ' + error);
  }
}

// Encrypt wallet data
export async function encryptWalletData(data: string, password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Derive key from password
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv
    },
    derivedKey,
    encoder.encode(data)
  );

  // Combine salt, iv, and encrypted data
  const result = new Uint8Array(salt.length + iv.length + new Uint8Array(encryptedData).length);
  result.set(salt, 0);
  result.set(iv, salt.length);
  result.set(new Uint8Array(encryptedData), salt.length + iv.length);

  return uint8ArrayToHex(result);
}

// Decrypt wallet data
export async function decryptWalletData(encryptedData: string, password: string): Promise<string> {
  const decoder = new TextDecoder();
  const data = hexToUint8Array(encryptedData);

  const salt = data.slice(0, 16);
  const iv = data.slice(16, 28);
  const encrypted = data.slice(28);

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    key,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt']
  );

  const decryptedData = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    derivedKey,
    encrypted
  );

  return decoder.decode(decryptedData);
}

// Store encrypted wallet data
export function storeWalletData(encryptedData: string): void {
  localStorage.setItem('wallet_data', encryptedData);
}

// Retrieve encrypted wallet data
export function getStoredWalletData(): string | null {
  return localStorage.getItem('wallet_data');
}