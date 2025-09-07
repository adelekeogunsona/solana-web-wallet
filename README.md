# Solana Multi-Wallet Web Application

A secure, fully client-side Solana wallet application built with React and TypeScript. Manage multiple Solana wallets without relying on any backend server - all sensitive data stays on your device with strong encryption.

## 🔐 Security Features

- **Client-Side Only**: No backend servers, all operations run in your browser
- **Strong Encryption**: AES-256-GCM encryption for all sensitive data
- **Local Storage**: Private keys and seed phrases never leave your device
- **Auto-Logout**: Configurable session timeout for enhanced security
- **Memory Protection**: Sensitive data cleared from memory when not in use

## ✨ Features

- **Multiple Wallet Management**: Import and manage multiple Solana wallets
- **Balance Tracking**: View SOL and SPL token balances in real-time
- **Token Support**: Display all SPL tokens with metadata and logos
- **Send/Receive**: Complete transaction functionality with fee estimation
- **QR Codes**: Generate QR codes for easy address sharing
- **Transaction History**: View and track all wallet transactions
- **Progressive Web App**: Install as an app with offline capabilities
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Modern browser with Web Crypto API support (Chrome, Firefox, Safari, Edge)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd solana-web-wallet
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment to any static hosting service.

## 🛠️ Technology Stack

- **Frontend**: React 19 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with custom styling
- **Icons**: Heroicons and Lucide React
- **Forms**: React Hook Form for efficient form handling
- **Routing**: React Router for navigation
- **Blockchain**: Solana Web3.js and SPL Token libraries
- **Cryptography**: Web Crypto API for encryption
- **Storage**: LocalStorage for preferences, encrypted storage for sensitive data

## 🔧 Configuration

### RPC Endpoints

The application connects to Solana RPC nodes for blockchain data. You can configure custom RPC endpoints in the Settings page:

- Default endpoints are provided for Mainnet, Testnet, and Devnet
- Support for custom RPC endpoints
- Automatic failover between multiple endpoints
- Health checking and performance monitoring

### Security Settings

- **Auto-logout Duration**: Configurable session timeout (default: 15 minutes)
- **PIN Authentication**: 6-digit PIN for wallet access
- **Backup Options**: Export encrypted wallet data for backup

## 📱 Progressive Web App

This application can be installed as a PWA on supported devices:

1. Visit the application in a supported browser
2. Click the "Install" prompt or use browser's install option
3. The app will be available offline for cached operations

## 🔒 Security Architecture

### Encryption

- **Algorithm**: AES-256-GCM for symmetric encryption
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Random Generation**: Cryptographically secure random numbers
- **Salt & IV**: Unique salt and initialization vector per operation

### Data Storage

- **Sensitive Data**: Encrypted and stored locally in browser storage
- **Session Management**: Temporary session keys with configurable expiration
- **Memory Handling**: Automatic cleanup of sensitive data from memory

### Privacy

- **No Tracking**: No analytics or tracking of user activity
- **No Servers**: All data processing happens client-side
- **No Network Transmission**: Private keys never transmitted over network

## 🧪 Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure

```
src/
├── components/     # Reusable UI components
├── context/        # React context providers
├── hooks/          # Custom React hooks
├── layouts/        # Page layout components
├── lib/            # Utility libraries
├── pages/          # Application pages/routes
└── utils/          # Utility functions
```

### Key Components

- **Wallet Management**: `src/utils/wallet.ts` - Core wallet operations
- **RPC Manager**: `src/utils/rpc.ts` - Blockchain communication
- **Authentication**: `src/context/AuthContext.tsx` - User authentication
- **Settings**: `src/context/SettingsProvider.tsx` - Application configuration

## 🌐 Deployment

This application can be deployed to any static hosting service:

- **GitHub Pages**: Automated deployment from repository
- **Netlify**: Drag-and-drop or Git integration
- **Vercel**: Zero-configuration deployment
- **Any CDN**: Upload `dist` folder contents

### Requirements for Production

- HTTPS is required for Web Crypto API
- Modern browser support (last 2 versions)
- No server-side configuration needed

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with clear messages: `git commit -m 'Add feature description'`
5. Push to your fork: `git push origin feature-name`
6. Submit a pull request

### Security Considerations

When contributing, please ensure:
- No introduction of external dependencies without security review
- All cryptographic operations use established libraries
- No logging of sensitive data
- Proper input validation and sanitization

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided "as is" without warranty. Users are responsible for:
- Securely backing up their wallet data
- Keeping their devices secure
- Understanding the risks of cryptocurrency transactions
- Verifying transaction details before confirmation

Always test with small amounts first and ensure you have proper backups of your wallet data.
