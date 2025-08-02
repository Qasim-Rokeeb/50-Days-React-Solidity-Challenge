import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Plus, Send, Loader2, AlertCircle, CheckCircle2, TrendingUp, Coins } from 'lucide-react';

// Contract ABIs
const TOKEN_MANAGER_ABI = [
  "function registerToken(address tokenAddress) external payable",
  "function batchTransfer((address,address,uint256)[] transfers) external",
  "function getUserBalances(address user, address[] tokens) external view returns (uint256[])",
  "function getTokenPortfolio(address user) external view returns (address[], uint256[], string[], string[])",
  "function getRegisteredTokens() external view returns (address[])",
  "function getTokenInfo(address token) external view returns (tuple(string,string,uint8,uint256,bool,uint256))",
  "function registrationFee() external view returns (uint256)",
  "event TokenRegistered(address indexed token, string name, string symbol)",
  "event BatchTransferExecuted(address indexed user, uint256 successCount, uint256 totalCount)"
];

const ERC20_ABI = [
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function balanceOf(address) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)"
];

export default function TokenManagerDashboard() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Contract data
  const [portfolio, setPortfolio] = useState([]);
  const [registeredTokens, setRegisteredTokens] = useState([]);
  const [registrationFee, setRegistrationFee] = useState('0');
  
  // Form states
  const [newTokenAddress, setNewTokenAddress] = useState('');
  const [batchTransfers, setBatchTransfers] = useState([{ token: '', recipient: '', amount: '' }]);
  
  // UI states
  const [activeTab, setActiveTab] = useState('portfolio');

  const CONTRACT_ADDRESS = "0x1234567890123456789012345678901234567890"; // Replace with actual deployed address

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask not found");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const account = await signer.getAddress();
      
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TOKEN_MANAGER_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(account);
      
      await loadContractData(contract, account);
      
      setMessage("Wallet connected successfully!");
    } catch (error) {
      setMessage(`Connection failed: ${error.message}`);
    }
  };

  const loadContractData = async (contractInstance, userAccount) => {
    try {
      setLoading(true);
      
      // Get registration fee
      const fee = await contractInstance.registrationFee();
      setRegistrationFee(ethers.formatEther(fee));
      
      // Get registered tokens
      const tokens = await contractInstance.getRegisteredTokens();
      setRegisteredTokens(tokens);
      
      // Get user portfolio
      if (userAccount) {
        const [tokenAddresses, balances, names, symbols] = await contractInstance.getTokenPortfolio(userAccount);
        
        const portfolioData = tokenAddresses.map((address, index) => ({
          address,
          balance: balances[index],
          name: names[index],
          symbol: symbols[index],
          formattedBalance: ethers.formatEther(balances[index])
        })).filter(token => token.name && parseFloat(token.formattedBalance) > 0);
        
        setPortfolio(portfolioData);
      }
    } catch (error) {
      console.error("Error loading contract data:", error);
      setMessage(`Error loading data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const registerToken = async () => {
    if (!contract || !newTokenAddress) return;
    
    try {
      setLoading(true);
      setMessage("Registering token...");
      
      const fee = await contract.registrationFee();
      const tx = await contract.registerToken(newTokenAddress, { value: fee });
      await tx.wait();
      
      setMessage("Token registered successfully!");
      setNewTokenAddress('');
      await loadContractData(contract, account);
    } catch (error) {
      setMessage(`Registration failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const executeBatchTransfer = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      setMessage("Preparing batch transfer...");
      
      // Filter valid transfers
      const validTransfers = batchTransfers.filter(t => 
        t.token && t.recipient && t.amount && parseFloat(t.amount) > 0
      );
      
      if (validTransfers.length === 0) {
        throw new Error("No valid transfers");
      }
      
      // Check and approve tokens
      for (const transfer of validTransfers) {
        const tokenContract = new ethers.Contract(transfer.token, ERC20_ABI, signer);
        const amount = ethers.parseEther(transfer.amount);
        
        const allowance = await tokenContract.allowance(account, CONTRACT_ADDRESS);
        if (allowance < amount) {
          setMessage(`Approving ${transfer.amount} tokens...`);
          const approveTx = await tokenContract.approve(CONTRACT_ADDRESS, amount);
          await approveTx.wait();
        }
      }
      
      // Execute batch transfer
      const transferItems = validTransfers.map(t => [
        t.token,
        t.recipient,
        ethers.parseEther(t.amount)
      ]);
      
      setMessage("Executing batch transfer...");
      const tx = await contract.batchTransfer(transferItems);
      await tx.wait();
      
      setMessage("Batch transfer completed!");
      setBatchTransfers([{ token: '', recipient: '', amount: '' }]);
      await loadContractData(contract, account);
    } catch (error) {
      setMessage(`Batch transfer failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addTransferRow = () => {
    setBatchTransfers([...batchTransfers, { token: '', recipient: '', amount: '' }]);
  };

  const updateTransfer = (index, field, value) => {
    const updated = [...batchTransfers];
    updated[index][field] = value;
    setBatchTransfers(updated);
  };

  const removeTransferRow = (index) => {
    if (batchTransfers.length > 1) {
      setBatchTransfers(batchTransfers.filter((_, i) => i !== index));
    }
  };

  useEffect(() => {
    if (contract && account) {
      loadContractData(contract, account);
    }
  }, [contract, account]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <Coins className="w-10 h-10" />
            Multi-Token Manager
          </h1>
          <p className="text-purple-200">Manage multiple ERC-20 tokens with advanced batch operations</p>
        </div>

        {/* Connection Status */}
        {!account ? (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center mb-8">
            <Wallet className="w-16 h-16 text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all transform hover:scale-105"
            >
              Connect MetaMask
            </button>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-200">Connected Account</p>
                <p className="text-white font-mono text-sm">{account}</p>
              </div>
              <div className="text-right">
                <p className="text-purple-200">Registration Fee</p>
                <p className="text-white font-semibold">{registrationFee} ETH</p>
              </div>
            </div>
          </div>
        )}

        {account && (
          <>
            {/* Navigation Tabs */}
            <div className="flex space-x-4 mb-8">
              {[
                { id: 'portfolio', label: 'Portfolio', icon: TrendingUp },
                { id: 'register', label: 'Register Token', icon: Plus },
                { id: 'batch', label: 'Batch Transfer', icon: Send }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-white text-purple-900'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-6">
              {activeTab === 'portfolio' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Your Token Portfolio</h3>
                  {portfolio.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                      <p className="text-purple-200">No tokens found in your portfolio</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {portfolio.map((token, index) => (
                        <div key={index} className="bg-white/10 rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <h4 className="text-white font-semibold">{token.name} ({token.symbol})</h4>
                            <p className="text-purple-200 text-sm font-mono">{token.address}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-white font-bold text-lg">{token.formattedBalance}</p>
                            <p className="text-purple-200 text-sm">{token.symbol}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'register' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Register New Token</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-purple-200 mb-2">Token Contract Address</label>
                      <input
                        type="text"
                        value={newTokenAddress}
                        onChange={(e) => setNewTokenAddress(e.target.value)}
                        placeholder="0x..."
                        className="w-full p-3 bg-white/20 border border-purple-300 rounded-lg text-white placeholder-purple-300 focus:outline-none focus:border-purple-400"
                      />
                    </div>
                    <button
                      onClick={registerToken}
                      disabled={loading || !newTokenAddress}
                      className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white p-3 rounded-lg font-semibold hover:from-green-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Registering...
                        </div>
                      ) : (
                        `Register Token (Fee: ${registrationFee} ETH)`
                      )}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'batch' && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-6">Batch Transfer</h3>
                  <div className="space-y-4">
                    {batchTransfers.map((transfer, index) => (
                      <div key={index} className="bg-white/10 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-purple-200 mb-1 text-sm">Token Address</label>
                            <input
                              type="text"
                              value={transfer.token}
                              onChange={(e) => updateTransfer(index, 'token', e.target.value)}
                              placeholder="0x..."
                              className="w-full p-2 bg-white/20 border border-purple-300 rounded text-white placeholder-purple-300 text-sm focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <div>
                            <label className="block text-purple-200 mb-1 text-sm">Recipient</label>
                            <input
                              type="text"
                              value={transfer.recipient}
                              onChange={(e) => updateTransfer(index, 'recipient', e.target.value)}
                              placeholder="0x..."
                              className="w-full p-2 bg-white/20 border border-purple-300 rounded text-white placeholder-purple-300 text-sm focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <div>
                            <label className="block text-purple-200 mb-1 text-sm">Amount</label>
                            <input
                              type="number"
                              value={transfer.amount}
                              onChange={(e) => updateTransfer(index, 'amount', e.target.value)}
                              placeholder="0.0"
                              step="0.000001"
                              className="w-full p-2 bg-white/20 border border-purple-300 rounded text-white placeholder-purple-300 text-sm focus:outline-none focus:border-purple-400"
                            />
                          </div>
                          <div className="flex items-end">
                            <button
                              onClick={() => removeTransferRow(index)}
                              disabled={batchTransfers.length === 1}
                              className="w-full p-2 bg-red-500/20 border border-red-400 text-red-300 rounded hover:bg-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex gap-4">
                      <button
                        onClick={addTransferRow}
                        className="flex-1 bg-white/20 border border-purple-300 text-purple-200 p-3 rounded-lg hover:bg-white/30 transition-all"
                      >
                        Add Transfer
                      </button>
                      <button
                        onClick={executeBatchTransfer}
                        disabled={loading}
                        className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {loading ? (
                          <div className="flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Processing...
                          </div>
                        ) : (
                          'Execute Batch Transfer'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Status Message */}
            {message && (
              <div className={`mt-6 p-4 rounded-lg flex items-center gap-3 ${
                message.includes('success') || message.includes('completed')
                  ? 'bg-green-500/20 border border-green-400 text-green-300'
                  : message.includes('failed') || message.includes('Error')
                  ? 'bg-red-500/20 border border-red-400 text-red-300'
                  : 'bg-blue-500/20 border border-blue-400 text-blue-300'
              }`}>
                {message.includes('success') || message.includes('completed') ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : message.includes('failed') || message.includes('Error') ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Loader2 className="w-5 h-5 animate-spin" />
                )}
                {message}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}