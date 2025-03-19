# Memory Bank (VERY IMPORTANT)
As part of your responsibilities, maintain a comprehensive memory.md file in the project's root folder to make future interactions more efficient.

After completing each request, read the memory file, see the structure and then please update the memory.md file with:

1. Any new components, modules, or files added or modified
2. Technical implementation details of how these components work
3. Updates to dependencies or architectural changes
4. Changes to data flows or state management

When creating or updating the memory.md file:

1. Structure it with clear headings (use markdown ##, ###)
2. Include if not already done:
   - Project overview (purpose, key features)
   - Core technologies used
   - Technical implementation details (for each key file/component)
   - Project directory structure
   - Workflow descriptions
   - Security architecture (if applicable)
   - Data flow diagrams (in text form)

For technical implementation details, explain:
- What the component/file does
- How it accomplishes its functionality
- Key methods/functions and their purposes
- Integration with other parts of the system
- Design patterns used
- Performance considerations

Keep the file concise yet comprehensive enough that a new AI session can understand the project without extensive explanation.

If this is our first interaction on a project, explore the codebase before creating the initial memory.md file.

The goal is to create a persistent memory that improves with each interaction, making future development more efficient.

---

# Solana Multi-Wallet Web Application Memory

## Project Overview

A browser-based application for managing multiple Solana wallets with the following key features:
- Client-side only (no backend server)
- Local encryption for sensitive data
- Direct communication with Solana blockchain
- PWA capabilities
- Multiple wallet management
- Token tracking and transfers
- Secure authentication system

## Core Technologies

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS
- **Router**: React Router v7
- **Form Handling**: React Hook Form
- **State Management**: React Context API
- **Blockchain**: Solana Web3.js, SPL Token
- **Cryptography**: BIP39, ED25519
- **UI Components**: Radix UI, Headless UI
- **Build Tools**: Vite

## Architecture

### Security Architecture

1. **Encryption System**
   - Client-side encryption using Web Crypto API
   - No server storage of sensitive information
   - Encrypted storage of seed phrases and private keys
   - Auto-logout functionality
   - PIN protection for sensitive operations
   - Secure memory management

2. **Authentication Flow**
   ```
   User → Password Entry → Key Derivation → Decrypt Stored Data → Authentication State
   ```

### Data Flow Architecture

1. **Wallet Operations**
   ```
   User Action → AuthContext Method → Wallet Utility → Solana RPC → UI Update
   ```

2. **Transaction Flow**
   ```
   Form Input → Validation → Transaction Building → Signature → Broadcast → Confirmation → Status Update
   ```

3. **Token Management Flow**
   ```
   Wallet Selection → Token Account Fetch → Metadata Resolution → Balance Display → User Interaction
   ```

### RPC Architecture

- Multiple endpoint support with health monitoring
- Automatic endpoint selection based on performance
- Request batching and rate limiting prevention
- Intelligent caching system
- Fault tolerance with request retries
- Connection pooling for improved performance

## Project Structure

### Key Directories
- `/src/components/` - React components
- `/src/context/` - Context providers and types
- `/src/hooks/` - Custom React hooks
- `/src/pages/` - Page components for routing
- `/src/utils/` - Utility functions and blockchain operations
- `/src/layouts/` - Layout components
- `/src/components/ui/` - Reusable UI components
- `/src/lib/` - Common utility libraries

### Core Files Implementation

#### Application Core
- `src/main.tsx` - Application entry point
- `src/App.tsx` - Main application component and routing
- `src/index.css` - Global CSS with Tailwind imports

#### Context System
- `src/context/AuthContext.tsx` - Authentication and wallet management
- `src/context/authContextTypes.ts` - Authentication types
- `src/context/SettingsProvider.tsx` - Settings management
- `src/context/settingsTypes.ts` - Settings types
- `src/context/settingsContext.ts` - Settings context creation

#### Page Components
- `src/pages/Login.tsx` - Authentication interface
- `src/pages/Setup.tsx` - Initial setup workflow
- `src/pages/Home.tsx` - Main dashboard
- `src/pages/AddWallet.tsx` - New wallet creation
- `src/pages/AddWalletImport.tsx` - Import workflow
- `src/pages/ImportWallet.tsx` - Existing wallet import
- `src/pages/WalletSetup.tsx` - Wallet configuration
- `src/pages/Settings.tsx` - App settings
- `src/pages/Transfer.tsx` - Transfer functionality

#### Core Components
- `src/components/WalletCard.tsx` - Individual wallet display
- `src/components/WalletGrid.tsx` - Wallet collection display
- `src/components/TokenList.tsx` - SPL token listing
- `src/components/TokenCard.tsx` - Individual token display
- `src/components/TokenSection.tsx` - Token section management
- `src/components/SendForm.tsx` - Transfer functionality
- `src/components/TokenSendModal.tsx` - Transfer modal
- `src/components/ReceiveForm.tsx` - Receive functionality
- `src/components/TransactionList.tsx` - Transaction history
- `src/components/PinInput.tsx` - Secure PIN entry
- `src/components/AddWalletButton.tsx` - Wallet addition

#### Utils & Hooks

- `src/utils/rpc.ts` - Solana RPC communication with advanced manager
- `src/utils/rpcValidation.ts` - Validation for RPC operations
- `src/utils/wallet.ts` - Wallet creation and management
- `src/hooks/useTokens.ts` - Token data management
- `src/hooks/useSolPrice.ts` - SOL price fetching
- `src/hooks/useToast.ts` - Toast notification system
- `src/hooks/useAuth.ts` - Authentication hook
- `src/hooks/useSettings.ts` - Settings management hook

## Technical Implementation Details

### Authentication System

The authentication system uses the Web Crypto API for encryption and secure storage:

- **AuthContext.tsx**: Implements a context provider that:
  - Manages user authentication state (logged in/out)
  - Handles password-based encryption using PBKDF2 key derivation
  - Encrypts wallet data with AES-256-GCM before storing in IndexedDB
  - Implements auto-logout functionality based on inactivity
  - Provides methods for wallet management (add, remove, select)
  - Includes PIN validation for sensitive operations

### Wallet Management

- **wallet.ts**: Core wallet implementation that:
  - Generates new wallets using BIP39 and ED25519-HD-Key derivation
  - Imports wallets from seed phrases and private keys
  - Validates wallet credentials
  - Creates Keypair objects compatible with Solana Web3.js
  - Manages wallet metadata (name, icon, etc.)
  - Provides utility functions for format conversion

### Blockchain Communication

- **rpc.ts**: Advanced RPC manager that:
  - Connects to configurable Solana RPC endpoints
  - Implements endpoint health monitoring and auto-switching
  - Uses request batching and queue management to prevent rate limiting
  - Provides comprehensive caching for performance optimization
  - Fetches SOL balances and token accounts
  - Handles token metadata resolution
  - Manages transaction building, signing, and broadcasting
  - Implements robust error handling and retry logic
  - Monitors network health and slot updates
  - Optimizes request distribution across multiple endpoints

### User Interface Components

- **WalletCard.tsx**: Displays wallet information with:
  - SOL balance with auto-refresh
  - Copy address functionality
  - Quick actions for send/receive
  - Custom styling based on wallet metadata
  - Animation for balance updates
  - Backup and export options

- **WalletGrid.tsx**: Manages the collection of wallets:
  - Implements wallet switching
  - Handles wallet filtering and sorting
  - Provides a responsive grid layout
  - Includes wallet deletion functionality

- **TokenSendModal.tsx**: Advanced token sending interface:
  - Real-time validation of addresses
  - Dynamic fee calculation
  - Associated token account creation handling
  - Token transfer workflows
  - Multi-step confirmation process
  - Error handling and recovery
  - Comprehensive status feedback

- **SendForm.tsx**: Handles transaction creation:
  - Real-time validation of addresses and amounts
  - Fee calculation and display
  - Transaction confirmation flow
  - Error handling and recovery
  - Integration with RPC module for transaction submission

- **ReceiveForm.tsx**: Handles receiving funds:
  - Displays QR code for wallet address using qrcode.react
  - Shows current wallet's public key in a read-only input
  - Provides copy-to-clipboard functionality with toast notifications
  - Supports dark mode for QR code display
  - Lists supported token types (SOL and SPL)
  - Handles no-wallet state gracefully
  - Implements accessible UI elements
  - Provides visual feedback for user actions

### Token Management

- **useTokens.ts**: Custom hook that:
  - Fetches token account data for selected wallet
  - Resolves token metadata from on-chain data
  - Handles unknown tokens gracefully
  - Provides sorting of tokens (verified first, then by name)
  - Implements parallel fetching of token metadata
  - Manages loading and error states

- **TokenList.tsx**: Renders token holdings:
  - Displays token icons, symbols, and balances
  - Handles loading and error states
  - Shows empty state when no tokens found
  - Integrates with TokenCard for individual token display

- **TokenSection.tsx**: Manages token display section:
  - Organizes token information display
  - Handles user interactions with tokens
  - Provides layout organization for the token area

### Settings Management

- **SettingsProvider.tsx**: Manages application configuration:
  - Stores user preferences in LocalStorage
  - Provides theme switching functionality
  - Manages RPC endpoint configuration
  - Controls auto-logout duration
  - Implements settings persistence between sessions

### Security Implementation

- **Encryption Flow**:
  1. User password → PBKDF2 derivation with high iteration count → Encryption key
  2. Encryption key + random IV → AES-256-GCM encryption → Encrypted wallet data
  3. Encrypted data + salt + IV stored in IndexedDB
  4. Memory cleared after operations complete

- **PinInput.tsx**: Secure PIN entry that:
  - Prevents clipboard access to PIN
  - Implements masking
  - Provides visual feedback
  - Auto-focuses between inputs
  - Clears input on errors

### Page Implementation

- **Home.tsx**: Main dashboard that:
  - Orchestrates components for wallet display
  - Manages state for selected wallet
  - Provides wallet backup functionality
  - Implements secure seed phrase and private key display
  - Includes PIN verification for sensitive operations
  - Handles wallet deletion with confirmation

- **Setup.tsx**: Handles first-time setup:
  - Guides users through password creation
  - Generates and validates recovery phrases
  - Implements multi-step wizard interface
  - Performs secure storage setup
  - Creates initial encryption keys

- **Login.tsx**: Handles authentication:
  - Validates login credentials
  - Manages login attempts and security
  - Provides password visibility toggle
  - Implements remember-device functionality
  - Handles biometric authentication where available

### Hooks Implementation

- **useSolPrice.ts**: Fetches SOL price data:
  - Uses public APIs to get price information
  - Implements caching to reduce API calls
  - Provides automatic refresh
  - Handles network errors gracefully

- **useToast.ts**: Toast notification system:
  - Manages queue of notifications
  - Provides different toast types (success, error, info)
  - Implements auto-dismiss functionality
  - Ensures accessibility compliance

## Key Functionality

1. **Authentication**
   - Master password/PIN protection
   - Local encryption

2. **Wallet Management**
   - Create/import wallets (seed phrase, private key)
   - View and switch between multiple wallets
   - Custom wallet naming
   - Wallet backup and recovery

3. **Balance & Token Display**
   - SOL balance
   - SPL token balances
   - Token metadata display
   - Verified token identification

4. **Transactions**
   - Send/receive SOL
   - Send/receive SPL tokens
   - Transaction history
   - Fee estimation and management

5. **Settings**
   - RPC endpoint configuration
   - UI preferences
   - Security settings
   - Network configuration

## Security Architecture

- Client-side encryption using modern web crypto APIs
- No server storage of sensitive information
- Seed phrases and private keys never stored unencrypted
- Auto-logout functionality
- PIN protection for sensitive operations
- Secure memory management for secrets

## RPC Management

- Multiple endpoint support with health monitoring
- Automatic endpoint selection based on performance and health
- Request batching and rate limiting prevention
- Intelligent caching system
- Fault tolerance with request retries
- Connection pooling for improved performance

## Data Flow

1. **User Authentication**:
   User → Password Entry → Key Derivation → Decrypt Stored Data → Authentication State

2. **Wallet Operations**:
   User Action → AuthContext Method → Wallet Utility → Solana RPC → UI Update

3. **Transaction Flow**:
   Form Input → Validation → Transaction Building → Signature → Broadcast → Confirmation → Status Update

4. **Token Management Flow**:
   Wallet Selection → Token Account Fetch → Metadata Resolution → Balance Display → User Interaction

## Project Requirements

For full project requirements, refer to `requirements.md`.
