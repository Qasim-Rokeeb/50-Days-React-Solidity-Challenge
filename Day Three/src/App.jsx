import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Coins, Plus, Minus, Users, Pause, Play, Shield, AlertCircle } from 'lucide-react';

const EnhancedTokenDApp = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [balance, setBalance] = useState('0');
  const [totalSupply, setTotalSupply] = useState('0');
  const [maxSupply, setMaxSupply] = useState('0');
  const [isOwner, setIsOwner] = useState(false);
  const [isMinter, setIsMinter] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState('');
  
  // Form states
  const [mintAmount, setMintAmount] = useState('');
  const [mintTo, setMintTo] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [transferTo, setTransferTo] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [minterAddress, setMinterAddress] = useState('');

  // Contract ABI (simplified for this example)
  const contractABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)", 
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function mint(address to, uint256 amount)",
    "function burn(uint256 amount)",
    "function addMinter(address account)",
    "function removeMinter(address account)",
    "function pause()",
    "function unpause()",
    "function owner() view returns (address)",
    "function isMinter(address account) view returns (bool)",
    "function paused() view returns (bool)",
    "function MAX_SUPPLY() view returns (uint256)",
    "function remainingMintableSupply() view returns (uint256)",
    "event Transfer(address indexed from, address indexed to, uint256 value)",
    "event TokensMinted(address indexed to, uint256 amount)",
    "event TokensBurned(address indexed from, uint256 amount)"
  ];

  const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE"; // Repl

  useEffect(() => {
    initializeWeb3();
  }, []);

  useEffect(() => {
    if (contract && account) {
      loadContractData();
    }
  }, [contract, account]);

  const initializeWeb3 = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = await signer.getAddress();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(address);
        
        if (contractAddress !== "YOUR_CONTRACT_ADDRESS_HERE") {
          const contract = new ethers.Contract(contractAddress, contractABI, signer);
          setContract(contract);
        }
      } catch (error) {
        console.error('Error connecting to MetaMask:', error);
      }
    }
  };

  const loadContractData = async () => {
    try {
      const [
        balance,
        totalSupply,
        maxSupply,
        owner,
        isMinter,
        isPaused
      ] = await Promise.all([
        contract.balanceOf(account),
        contract.totalSupply(),
        contract.MAX_SUPPLY(),
        contract.owner(),
        contract.isMinter(account),
        contract.paused()
      ]);

      setBalance(ethers.utils.formatEther(balance));
      setTotalSupply(ethers.utils.formatEther(totalSupply));
      setMaxSupply(ethers.utils.formatEther(maxSupply));
      setIsOwner(owner.toLowerCase() === account.toLowerCase());
      setIsMinter(isMinter);
      setIsPaused(isPaused);
    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  const handleMint = async () => {
    if (!contract || !mintAmount || !mintTo) return;
    
    setLoading(true);
    try {
      const amount = ethers.utils.parseEther(mintAmount);
      const tx = await contract.mint(mintTo, amount);
      setTxHash(tx.hash);
      await tx.wait();
      await loadContractData();
      setMintAmount('');
      setMintTo('');
    } catch (error) {
      console.error('Error minting tokens:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleBurn = async () => {
    if (!contract || !burnAmount) return;
    
    setLoading(true);
    try {
      const amount = ethers.utils.parseEther(burnAmount);
      const tx = await contract.burn(amount);
      setTxHash(tx.hash);
      await tx.wait();
      await loadContractData();
      setBurnAmount('');
    } catch (error) {
      console.error('Error burning tokens:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleTransfer = async () => {
    if (!contract || !transferAmount || !transferTo) return;
    
    setLoading(true);
    try {
      const amount = ethers.utils.parseEther(transferAmount);
      const tx = await contract.transfer(transferTo, amount);
      setTxHash(tx.hash);
      await tx.wait();
      await loadContractData();
      setTransferAmount('');
      setTransferTo('');
    } catch (error) {
      console.error('Error transferring tokens:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleAddMinter = async () => {
    if (!contract || !minterAddress) return;
    
    setLoading(true);
    try {
      const tx = await contract.addMinter(minterAddress);
      setTxHash(tx.hash);
      await tx.wait();
      setMinterAddress('');
    } catch (error) {
      console.error('Error adding minter:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const handlePauseToggle = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = isPaused ? await contract.unpause() : await contract.pause();
      setTxHash(tx.hash);
      await tx.wait();
      await loadContractData();
    } catch (error) {
      console.error('Error toggling pause:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center">
          <Coins className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">Please connect your MetaMask wallet to continue</p>
          <button
            onClick={initializeWeb3}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white">Enhanced Token DApp</h1>
            </div>
            <div className="text-right">
              <p className="text-gray-300">Connected: {formatAddress(account)}</p>
              <div className="flex items-center space-x-2 mt-1">
                {isOwner && (
                  <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg text-sm flex items-center">
                    <Shield className="w-4 h-4 mr-1" />
                    Owner
                  </span>
                )}
                {isMinter && (
                  <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-lg text-sm flex items-center">
                    <Plus className="w-4 h-4 mr-1" />
                    Minter
                  </span>
                )}
                {isPaused && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-lg text-sm flex items-center">
                    <Pause className="w-4 h-4 mr-1" />
                    Paused
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Your Balance</h3>
            <p className="text-3xl font-bold text-blue-400">{parseFloat(balance).toFixed(2)} ETK</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Total Supply</h3>
            <p className="text-3xl font-bold text-purple-400">{parseFloat(totalSupply).toFixed(2)} ETK</p>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Max Supply</h3>
            <p className="text-3xl font-bold text-indigo-400">{parseFloat(maxSupply).toFixed(0)} ETK</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transfer Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Coins className="w-6 h-6 mr-2" />
              Transfer Tokens
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Recipient address"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <input
                type="number"
                placeholder="Amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                onClick={handleTransfer}
                disabled={loading || isPaused}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : 'Transfer'}
              </button>
            </div>
          </div>

          {/* Burn Section */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center">
              <Minus className="w-6 h-6 mr-2" />
              Burn Tokens
            </h3>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Amount to burn"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
              />
              <button
                onClick={handleBurn}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors"
              >
                {loading ? 'Processing...' : 'Burn Tokens'}
              </button>
            </div>
          </div>

          {/* Mint Section (Only for minters) */}
          {isMinter && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Plus className="w-6 h-6 mr-2" />
                Mint Tokens
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Mint to address"
                  value={mintTo}
                  onChange={(e) => setMintTo(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
                <input
                  type="number"
                  placeholder="Amount to mint"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleMint}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors"
                >
                  {loading ? 'Processing...' : 'Mint Tokens'}
                </button>
              </div>
            </div>
          )}

          {/* Owner Controls */}
          {isOwner && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Shield className="w-6 h-6 mr-2" />
                Owner Controls
              </h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Address to add as minter"
                  value={minterAddress}
                  onChange={(e) => setMinterAddress(e.target.value)}
                  className="w-full bg-white/5 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400"
                />
                <button
                  onClick={handleAddMinter}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors mb-2"
                >
                  Add Minter
                </button>
                <button
                  onClick={handlePauseToggle}
                  disabled={loading}
                  className={`w-full ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} disabled:bg-gray-600 text-white py-3 rounded-lg transition-colors flex items-center justify-center`}
                >
                  {isPaused ? <Play className="w-5 h-5 mr-2" /> : <Pause className="w-5 h-5 mr-2" />}
                  {isPaused ? 'Unpause Contract' : 'Pause Contract'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Transaction Hash Display */}
        {txHash && (
          <div className="mt-6 bg-white/10 backdrop-blur-lg rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Latest Transaction</h3>
            <p className="text-green-400 break-all">{txHash}</p>
            <a
              href={`https://sepolia.basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 underline"
            >
              View on BaseScan
            </a>
          </div>
        )}

        {/* Warning for contract address */}
        {contractAddress === "YOUR_CONTRACT_ADDRESS_HERE" && (
          <div className="mt-6 bg-yellow-500/20 border border-yellow-500/50 rounded-2xl p-6">
            <div className="flex items-center">
              <AlertCircle className="w-6 h-6 text-yellow-400 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-400">Contract Not Deployed</h3>
                <p className="text-yellow-300">Please deploy your contract and update the contract address in the code.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedTokenDApp;