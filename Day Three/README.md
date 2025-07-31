# Day 3: Enhanced ERC-20 Token with Advanced Features

## 🎯 Learning Objectives

By the end of Day 3, you will understand:
- Advanced ERC-20 token features beyond basic transfers
- Role-based access control in smart contracts
- Token minting and burning mechanisms
- Contract pausing for emergency stops
- Event emission for better transparency
- Building comprehensive React frontends for complex contracts

## 📋 Prerequisites

- Completed Day 1 and Day 2
- MetaMask wallet with Base testnet ETH
- Basic understanding of React and Solidity
- VS Code with Solidity extension

## 🏗️ Project Overview

Today we're building an **Enhanced ERC-20 Token** that includes:

### Smart Contract Features:
- ✅ Standard ERC-20 functionality (transfer, approve, etc.)
- ✅ Minting with role-based access control
- ✅ Token burning (both from own balance and with allowance)
- ✅ Contract pausing for emergency stops
- ✅ Maximum supply cap
- ✅ Owner and minter role management
- ✅ Comprehensive event logging

### Frontend Features:
- ✅ Real-time balance and supply tracking
- ✅ Token transfer interface
- ✅ Minting interface (for authorized users)
- ✅ Token burning functionality
- ✅ Role management (owner only)
- ✅ Contract pause/unpause controls
- ✅ Transaction hash display with BaseScan links
- ✅ Responsive Tailwind CSS design

## 🚀 Quick Start

### 1. Deploy the Smart Contract

```bash
# Install dependencies
npm install @openzeppelin/contracts

# Compile and deploy using Hardhat/Remix
# Remember to replace constructor parameters:
# - name: "Enhanced Token"
# - symbol: "ETK" 
# - initialSupply: 100000 (100,000 tokens)
```

### 2. Update Frontend Configuration

In the React component, update the contract address:
```javascript
const contractAddress = "YOUR_DEPLOYED_CONTRACT_ADDRESS";
```

### 3. Install Frontend Dependencies

```bash
npm install ethers lucide-react
# Tailwind CSS should already be configured
```

### 4. Run the Application

```bash
npm start
```

## 📖 Key Concepts Learned

### 1. **Role-Based Access Control**
```solidity
mapping(address => bool) public minters;

modifier onlyMinter() {
    require(minters[msg.sender] || msg.sender == owner(), "Not authorized to mint");
    _;
}
```
- Separates minting permissions from ownership
- Allows delegation of specific privileges
- Essential for DeFi protocols with multiple operators

### 2. **Token Minting with Supply Cap**
```solidity
function mint(address to, uint256 amount) external onlyMinter {
    require(totalSupply() + amount <= MAX_SUPPLY, "Would exceed max supply");
    _mint(to, amount);
    emit TokensMinted(to, amount);
}
```
- Prevents infinite inflation
- Ensures economic model integrity
- Common in tokenomics design

### 3. **Flexible Burning Mechanisms**
```solidity
function burn(uint256 amount) external {
    _burn(msg.sender, amount);
}

function burnFrom(address account, uint256 amount) external {
    // Requires allowance from account
}
```
- Self-burning: Users can burn their own tokens
- Delegated burning: Burn with approval (useful for protocols)
- Reduces total supply permanently

### 4. **Emergency Pause Functionality**
```solidity
function _beforeTokenTransfer(...) internal override whenNotPaused {
    super._beforeTokenTransfer(from, to, amount);
}
```
- Stops all transfers during emergencies
- Critical for security incidents
- Reversible by contract owner

### 5. **Comprehensive Event Logging**
```solidity
event TokensMinted(address indexed to, uint256 amount);
event TokensBurned(address indexed from, uint256 amount);
event MinterAdded(address indexed account);
```
- Provides transparency for all major actions
- Enables frontend real-time updates
- Essential for DeFi protocol monitoring

## 🎨 Frontend Architecture

### Component Structure
```
EnhancedTokenDApp/
├── Connection Management
├── Contract State Management
├── Transfer Interface
├── Minting Interface (Role-based)
├── Burning Interface
├── Owner Controls (Role-based)
└── Transaction Monitoring
```

### Key Frontend Patterns

1. **Role-Based UI Rendering**
```javascript
{isMinter && (
  <MintingInterface />
)}

{isOwner && (
  <OwnerControls />
)}
```

2. **Real-time Data Updates**
```javascript
useEffect(() => {
  if (contract && account) {
    loadContractData();
  }
}, [contract, account]);
```

3. **Transaction State Management**
```javascript
const [loading, setLoading] = useState(false);
const [txHash, setTxHash] = useState('');
```

## 🔧 Testing Checklist

### Smart Contract Tests
- [ ] Deploy contract with initial supply
- [ ] Verify owner can add/remove minters
- [ ] Test minting by authorized accounts
- [ ] Test minting fails for unauthorized accounts
- [ ] Verify burning reduces total supply
- [ ] Test pause/unpause functionality
- [ ] Check maximum supply enforcement

### Frontend Tests
- [ ] Connect wallet successfully
- [ ] Display correct balances and supplies
- [ ] Transfer tokens between accounts
- [ ] Mint tokens (as minter)
- [ ] Burn tokens from balance
- [ ] Add new minter (as owner)
- [ ] Pause/unpause contract (as owner)
- [ ] View transaction hashes on BaseScan

## 🚨 Security Considerations

### Smart Contract Security
1. **Access Control**: Only authorized addresses can mint
2. **Supply Cap**: Prevents infinite token creation
3. **Pause Mechanism**: Emergency stop for security incidents
4. **Input Validation**: All functions validate inputs
5. **Reentrancy**: Uses OpenZeppelin's secure implementations

### Frontend Security
1. **Input Sanitization**: Validate all user inputs
2. **Error Handling**: Graceful handling of transaction failures
3. **Address Validation**: Check address formats before transactions
4. **Network Validation**: Ensure user is on correct network

