# 🏦 Multi-Asset Staking Pool

A decentralized staking platform that allows users to stake multiple ERC-20 tokens with different lock periods and earn rewards based on duration and amount staked.

## 🚀 Features

### Smart Contract Features
- **Multi-Token Support**: Stake any supported ERC-20 token
- **Flexible Lock Periods**: Choose from 7, 30, or 90-day lock periods
- **Dynamic Rewards**: Higher APY for longer commitments (5% → 12% → 25%)
- **Emergency Withdrawal**: Early exit with penalty mechanism
- **Compound Staking**: Automatically restake rewards for compound growth
- **Owner Controls**: Add/remove tokens, adjust reward rates

### Frontend Features
- **Intuitive Interface**: Clean, responsive design with Tailwind CSS
- **Real-time Portfolio**: Track all stakes with countdown timers
- **Reward Calculator**: Preview earnings before staking
- **Custom Token Support**: Add any ERC-20 token by contract address
- **Wallet Integration**: MetaMask connection with Base testnet support

## 🏗️ Architecture

### Smart Contract Structure
```
MultiAssetStakingPool.sol
├── Stake Management
│   ├── stake() - Create new stake
│   ├── unstake() - Withdraw after lock period
│   └── emergencyWithdraw() - Early exit with penalty
├── Reward System
│   ├── claimRewards() - Claim earned rewards
│   ├── compound() - Restake rewards
│   └── calculateRewards() - View pending rewards
└── Admin Functions
    ├── addSupportedToken() - Add new token
    ├── removeSupportedToken() - Remove token
    └── updateRewardRates() - Adjust APY rates
```

### Frontend Structure
```
src/
├── components/
│   ├── StakeInterface.jsx    # Token staking form
│   ├── Portfolio.jsx         # User stakes overview
│   ├── StakeCard.jsx         # Individual stake display
│   └── TokenSelector.jsx     # Token selection dropdown
├── hooks/
│   ├── useContract.js        # Contract interaction
│   ├── useWallet.js          # Wallet connection
│   └── useStaking.js         # Staking operations
├── utils/
│   ├── calculations.js       # Reward calculations
│   ├── formatters.js         # Number/date formatting
│   └── constants.js          # Contract addresses/ABIs
└── contracts/
    └── MultiAssetStakingPool.json  # Contract ABI
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm/yarn
- MetaMask browser extension
- Base testnet ETH for transactions

### Quick Start
```bash
# Clone the repository
git clone https://github.com/yourusername/multi-asset-staking-pool
cd multi-asset-staking-pool

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your contract addresses and API keys

# Start development server
npm run dev
```

### Environment Variables
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_BASE_TESTNET_RPC=https://sepolia.base.org
NEXT_PUBLIC_BASESCAN_API_KEY=your_api_key
```

## 🔧 Smart Contract Deployment

### Deploy to Base Testnet
```bash
# Install Hardhat
npm install --save-dev hardhat

# Compile contracts
npx hardhat compile

# Deploy to Base testnet
npx hardhat run scripts/deploy.js --network base-testnet

# Verify contract
npx hardhat verify --network base-testnet DEPLOYED_CONTRACT_ADDRESS
```

### Contract Configuration
```solidity
// Initial supported tokens
address[] memory initialTokens = [
    0x..., // USDC on Base testnet
    0x..., // WETH on Base testnet
    0x...  // DAI on Base testnet
];

// Lock periods and reward rates
lockPeriodToRate[7 days] = 500;   // 5% APY
lockPeriodToRate[30 days] = 1200; // 12% APY
lockPeriodToRate[90 days] = 2500; // 25% APY
```

## 💡 Usage Guide

### For Users

#### 1. Connect Wallet
- Click "Connect Wallet" in the top right
- Approve MetaMask connection
- Ensure you're on Base testnet (Chain ID: 84532)

#### 2. Stake Tokens
- Select a supported token from dropdown
- Enter amount to stake
- Choose lock period (7, 30, or 90 days)
- Review projected rewards
- Click "Stake Tokens" and confirm transaction

#### 3. Manage Portfolio
- View all active stakes in Portfolio tab
- Monitor countdown timers for unlock dates
- Claim rewards when available
- Use compound feature to maximize earnings

#### 4. Emergency Withdrawal
- Available anytime with 10% penalty
- Use only when absolutely necessary
- Penalty goes to reward pool for other stakers

### For Developers

#### Key Contract Functions
```solidity
// Stake tokens
function stake(address token, uint256 amount, uint256 lockPeriod) external;

// Calculate pending rewards
function calculateRewards(address user, uint256 stakeIndex) external view returns (uint256);

// Claim rewards without unstaking
function claimRewards(uint256 stakeIndex) external;

// Compound rewards back into stake
function compound(uint256 stakeIndex) external;

// Emergency withdrawal with penalty
function emergencyWithdraw(uint256 stakeIndex) external;
```

#### Frontend Integration
```javascript
// Connect to contract
const contract = new ethers.Contract(contractAddress, abi, signer);

// Stake tokens
const tx = await contract.stake(tokenAddress, amount, lockPeriod);
await tx.wait();

// Get user stakes
const stakes = await contract.getUserStakes(userAddress);

// Calculate rewards
const rewards = await contract.calculateRewards(userAddress, stakeIndex);
```

## 🧪 Testing

### Unit Tests
```bash
# Run contract tests
npx hardhat test

# Run with gas reporting
REPORT_GAS=true npx hardhat test

# Run specific test file
npx hardhat test test/StakingPool.test.js
```

### Frontend Testing
```bash
# Run React component tests
npm test

# Run E2E tests
npm run test:e2e

# Test specific component
npm test -- --testNamePattern="StakeInterface"
```

### Test Coverage
- ✅ Staking functionality with different tokens and periods
- ✅ Reward calculations for various scenarios
- ✅ Emergency withdrawal with penalty application
- ✅ Access control for admin functions
- ✅ Edge cases and error handling

## 🔒 Security Considerations

### Smart Contract Security
- **Access Control**: Only owner can add/remove tokens
- **Reentrancy Protection**: Using OpenZeppelin's ReentrancyGuard
- **Integer Overflow**: SafeMath for all calculations
- **Emergency Pause**: Circuit breaker for emergency situations

### Frontend Security
- **Input Validation**: All user inputs sanitized and validated
- **Transaction Signing**: Users must explicitly approve all transactions
- **Error Handling**: Graceful handling of failed transactions
- **HTTPS Only**: All API calls use secure connections

## 📊 Analytics & Monitoring

### Key Metrics
- Total Value Locked (TVL) across all tokens
- Average stake duration and amounts
- Reward distribution efficiency
- User engagement and retention

### Monitoring Tools
- **BaseScan**: Transaction and contract monitoring
- **Grafana**: Custom dashboards for metrics
- **Sentry**: Error tracking and performance monitoring

## 🚀 Deployment

### Frontend Deployment (Vercel)
```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod

# Set environment variables in Vercel dashboard
```
