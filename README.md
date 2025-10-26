# 🥔 Potato Finance

**Set it, spud it: effortless crypto basket rebalancing**

Potato Finance is a DeFi platform that enables automatic portfolio rebalancing through smart contracts. Create a crypto basket with custom token allocations, and Potato will automatically rebalance your holdings when ratios drift beyond your threshold.

## Overview

Potato Finance allows users to:

- **Create custom token baskets** with specific percentage allocations (e.g., 40% ETH, 40% BTC, 20% PYUSD)
- **Set rebalancing thresholds** to trigger automatic rebalancing when allocations drift
- **Use ENS subdomains** for human-readable basket addresses (e.g., `yourname.bb.pyusd.eth`)
- **Leverage account abstraction** with passkey-based authentication (no seed phrases!)
- **Integrate real-time price feeds** via Pyth Network oracles

### Example Use Case

A user creates a balanced basket:

- 40% ETH
- 40% BTC
- 20% PYUSD

When market movements cause the portfolio to drift to 50% ETH, 35% BTC, 15% PYUSD (>5% deviation), Potato automatically triggers a rebalancing transaction to restore the original 40/40/20 allocation.

## Project Structure

This is a monorepo workspace with three main packages:

```
potato/
├── packages/
│   ├── contracts/      # Smart contracts (Solidity + Hardhat)
│   ├── frontend/       # React web application
│   └── scripts/        # Portfolio backtesting tools
├── package.json        # Workspace configuration
└── README.md
```

## 📦 Packages

### 1. **contracts/** - Smart Contract Layer

The core protocol built with Solidity and deployed on Ethereum Sepolia testnet.

**Tech Stack:**

- **Hardhat 3.0** - Development environment and testing framework
- **OpenZeppelin Contracts** - Secure, audited contract libraries
- **ENS (Ethereum Name Service)** - Human-readable addresses
- **Pyth Network** - Real-time price feeds
- **Viem** - TypeScript Ethereum library

**Core Contracts:**

1. **`PotatoFinanceEntrypoint.sol`** - Main entry point for user onboarding

   - Manages user registration with nicknames
   - Creates ENS subdomains (`nickname.bb.pyusd.eth`, `nickname.cc.pyusd.eth`)
   - Deploys BB (balanced) and CC (crypto-only) baskets automatically
   - Integrates with ENS Registry and Resolver contracts

2. **`BasketFoundry.sol`** - Factory contract for creating baskets

   - Uses minimal proxy clones (EIP-1167) for gas-efficient deployments
   - Maintains registry of user baskets
   - Funds new baskets with 0.01 ETH for gas

3. **`Basket.sol`** - Individual basket implementation
   - Stores token allocations and percentages
   - Integrates with Pyth Network for price data
   - Implements rebalancing logic
   - Uses upgradeable pattern (OpenZeppelin Upgradeable)

**Deployed Addresses (Sepolia):**

```
BasketImplementation: 0x59DDEE9ECC6bD1A4D081578d45Aef656297A72c4
BasketFoundry:        0xfb63FD3482EB51Eca0f6c69969B735e2C544748A
PotatoFinanceEntrypoint: 0x6d7e9b04ea3C35C6D0d4b912071976aAb1b51919
```

**Key Features:**

- **Two default basket types:**
  - **BB (Balanced)**: 40% BTC, 40% ETH, 20% PYUSD
  - **CC (Crypto-only)**: 50% BTC, 50% ETH, 0% PYUSD
- **ENS Integration**: Each user gets subdomains under `pyusd.eth`
- **Upgradeable Baskets**: Using OpenZeppelin's upgradeable proxy pattern
- **Price Feeds**: Pyth Network for real-time, decentralized pricing

**Development:**

```bash
cd packages/contracts

# Install dependencies
bun install

# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Sepolia
npx hardhat ignition deploy ignition/modules/PotatoFinanceEntrypoint.ts --network sepolia
```

### 2. **frontend/** - Web Application

A modern React application with Web3 integration and account abstraction.

**Tech Stack:**

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Viem 2.x** - Ethereum interactions
- **Wagmi 2.x** - React hooks for Ethereum
- **Permissionless** - Account abstraction (ERC-4337)
- **Pimlico** - Bundler service for account abstraction
- **Vite** - Build tool and dev server
- **TanStack Query** - Async state management

**Key Features:**

- **Passkey Authentication**: No seed phrases—use biometrics or device authentication
- **Account Abstraction (ERC-4337)**:
  - Gasless transactions (sponsored by paymaster)
  - Smart contract wallets
  - Batch operations
- **ENS Integration**: Human-readable wallet addresses
- **Real-time Portfolio Tracking**: Live basket values and allocations
- **One-click Rebalancing**: Trigger rebalances directly from the UI

**User Flow:**

1. User creates a passkey (Face ID, Touch ID, or security key)
2. System generates a smart contract wallet
3. User chooses a nickname (e.g., "zkfriendly")
4. Contracts create two baskets and register ENS subdomains
5. User can view portfolio and trigger rebalances

**Development:**

```bash
cd packages/frontend

# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build
```

**Configuration:**
Edit `src/config.ts` to update contract addresses and network settings.

### 3. **scripts/** - Backtesting Tools

Portfolio rebalancing strategy backtesting and analysis tools.

**Tech Stack:**

- **Bun** - Runtime and package manager
- **TypeScript** - Type-safe backtesting
- **CSV Data** - Historical price data from CoinMarketCap
- **Pine Script** - TradingView strategy implementations

**Features:**

- **Compare Strategies**: Rebalancing vs Buy & Hold
- **Historical Data**: Bitcoin and Ethereum data (Oct 2024 - Oct 2025)
- **Configurable Parameters**:
  - Initial investment amount
  - Target allocations (e.g., 50/50, 60/40)
  - Rebalancing threshold (e.g., 5%, 10%)
  - Date ranges
- **Multiple Interfaces**:
  - Local TypeScript backtests (full control)
  - TradingView Pine Script (visual charts)

**Example Output:**

```
🔄 REBALANCING STRATEGY:
  Final Value: $18,321.18
  Total Return: +83.21%
  Number of Rebalances: 6

💎 BUY & HOLD STRATEGY:
  Final Value: $17,685.31
  Total Return: +76.85%

📈 COMPARISON:
  Difference: +$635.87 (+3.60%)
  Winner: Rebalancing 🏆
```

**Development:**

```bash
cd packages/scripts

# Run backtest
bun start

# Or
bun run backtest
```

**Use Cases:**

- Validate rebalancing strategies before deploying
- Analyze historical performance
- Optimize rebalancing thresholds
- Compare different asset allocations

## 🏗️ Architecture

### Smart Contract Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  User / Frontend                        │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│          PotatoFinanceEntrypoint.sol                    │
│  • User registration & nickname mapping                 │
│  • ENS subdomain creation                               │
│  • Orchestrates basket creation                         │
└───────────┬────────────────────────┬────────────────────┘
            │                        │
            ▼                        ▼
┌─────────────────────┐    ┌─────────────────────────────┐
│  BasketFoundry.sol  │    │    ENS Registry             │
│  • Factory pattern  │    │  • bb.pyusd.eth             │
│  • Clone baskets    │    │  • cc.pyusd.eth             │
│  • User registry    │    │  • Resolver integration     │
└──────────┬──────────┘    └─────────────────────────────┘
           │
           │ creates clones
           ▼
┌─────────────────────────────────────────────────────────┐
│                  Basket.sol                             │
│  • Token allocations & percentages                      │
│  • Pyth price feed integration                          │
│  • Rebalancing logic                                    │
│  • Upgradeable (via proxy)                              │
└───────────────────────┬─────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────┐
│                Pyth Network Oracle                      │
│  • BTC/USD price feed                                   │
│  • ETH/USD price feed                                   │
│  • PYUSD/USD price feed                                 │
└─────────────────────────────────────────────────────────┘
```

**Key Design Patterns:**

1. **Factory Pattern (EIP-1167)**: `BasketFoundry` creates minimal proxy clones of the `Basket` implementation, reducing deployment costs by ~10x

2. **Upgradeable Proxies**: Baskets use OpenZeppelin's upgradeable pattern for future improvements

3. **ENS Integration**: Each user gets readable addresses:

   - `nickname.bb.pyusd.eth` → BB basket contract
   - `nickname.cc.pyusd.eth` → CC basket contract

4. **Oracle Integration**: Pyth Network provides decentralized, low-latency price feeds

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React App                            │
│                                                         │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │  Landing Page │  │ CreateProfile│  │   Profile   │ │
│  │  • Hero       │  │ • Nickname   │  │ • Portfolio │ │
│  │  • Features   │  │ • Setup      │  │ • Rebalance │ │
│  └───────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│          │                 │                  │        │
└──────────┴─────────────────┴──────────────────┴────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────┐
│              pimlico.ts (Web3 Layer)                    │
│  • Passkey authentication (WebAuthn)                    │
│  • Smart account creation (ERC-4337)                    │
│  • Transaction bundling & submission                    │
└───────────────────────┬─────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         ▼              ▼              ▼
┌────────────────┐ ┌────────┐ ┌────────────────┐
│ Pimlico        │ │ Viem   │ │ Smart Contract │
│ Bundler        │ │ Client │ │ Wallet (AA)    │
│ • Paymaster    │ │        │ │                │
│ • Gas sponsor  │ │        │ │                │
└────────────────┘ └────────┘ └────────────────┘
```

**Authentication Flow:**

1. **Passkey Creation**: Browser's WebAuthn API creates a passkey (biometric or security key)
2. **Keypair Derivation**: Public key is used to derive a deterministic private key
3. **Smart Account**: Account abstraction creates a smart contract wallet
4. **Transaction Signing**: Passkey signs operations, bundler submits to blockchain

**Benefits:**

- **No seed phrases**: User-friendly authentication
- **Gasless transactions**: Paymaster sponsors gas fees
- **Recovery**: Passkeys can be backed up to cloud
- **Multi-device**: Same account across devices

### Data Flow

```
User Action (Frontend)
    ↓
Passkey Signs Operation
    ↓
Bundler (Pimlico) → Smart Account Contract
    ↓
PotatoFinanceEntrypoint.setup()
    ↓
BasketFoundry.createBasket() × 2
    ↓
ENS Registry (create subdomains)
    ↓
User receives 2 baskets with ENS names
```

**Rebalancing Flow:**

```
User Triggers Rebalance
    ↓
Frontend → Basket.getBasketValue()
    ↓
Basket → Pyth Network (fetch prices)
    ↓
Calculate drift from target allocations
    ↓
If drift > threshold:
    Basket.rebalanceBasket()
    ↓
Tokens swapped to restore ratios
```

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.2.15
- Node.js >= 18 (for some tooling)
- MetaMask or compatible Web3 wallet (for contract deployment)

### Installation

1. **Clone the repository:**

```bash
git clone https://github.com/yourusername/potato.git
cd potato
```

2. **Install dependencies:**

```bash
bun install
```

3. **Set up environment variables:**

```bash
# In packages/contracts/
cp .env.example .env
# Add your SEPOLIA_PRIVATE_KEY and API keys
```

4. **Run the frontend:**

```bash
cd packages/frontend
bun run dev
```

5. **Run contract tests:**

```bash
cd packages/contracts
npx hardhat test
```

6. **Run backtests:**

```bash
cd packages/scripts
bun start
```

## 🔧 Configuration

### Contract Configuration

Edit `packages/contracts/hardhat.config.ts`:

- Network settings (Sepolia, Mainnet, etc.)
- Gas settings
- Verification API keys

### Frontend Configuration

Edit `packages/frontend/src/config.ts`:

- Contract addresses
- Network/chain settings
- Pimlico bundler configuration

### Backtest Configuration

Edit `packages/scripts/index.ts`:

- Initial investment amount
- Token allocations
- Rebalancing threshold
- Date range

## 🧪 Testing

### Contract Tests

```bash
cd packages/contracts

# Run all tests
npx hardhat test

# Run specific test file
npx hardhat test src/BasketFoundry.t.sol

# Run with gas reporting
REPORT_GAS=true npx hardhat test
```

### Frontend (Manual Testing)

1. Start local dev server: `bun run dev`
2. Use browser DevTools to test Web3 interactions
3. Connect to Sepolia testnet for integration tests

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions are welcome! Please open an issue or pull request.

## 🔗 Links

- **Frontend (Demo)**: [Coming soon]
- **Contracts (Etherscan)**: [Sepolia deployment](https://sepolia.etherscan.io/address/0x6d7e9b04ea3C35C6D0d4b912071976aAb1b51919)
- **Documentation**: This README
- **ENS Integration**: Uses `pyusd.eth` parent domain

## 💡 Future Enhancements

- [ ] Multi-chain support (Arbitrum, Optimism, Base)
- [ ] More basket templates
- [ ] Social features (share baskets, leaderboards)
- [ ] Advanced rebalancing strategies (time-based, volatility-adjusted)
- [ ] Automated rebalancing via Chainlink Automation or Gelato
- [ ] Mobile app (React Native)
- [ ] Portfolio analytics dashboard

---

Built with 🥔 by the Potato Finance team
