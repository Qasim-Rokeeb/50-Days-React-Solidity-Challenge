import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

const MessageStorageDApp = () => {
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [currentMessage, setCurrentMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messageSetter, setMessageSetter] = useState('');
  const [messageTimestamp, setMessageTimestamp] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Replace with your deployed contract address
  const CONTRACT_ADDRESS = "0x7738cEEd3340DEe3BFc76E15A40D1f6c2419fC3f";
  
  const CONTRACT_ABI = [
    {
      "inputs": [],
      "stateMutability": "nonpayable",
      "type": "constructor"
    },
    {
      "anonymous": false,
      "inputs": [
        {
          "indexed": true,
          "internalType": "address",
          "name": "setter",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "name": "MessageUpdated",
      "type": "event"
    },
    {
      "inputs": [],
      "name": "getMessage",
      "outputs": [
        {
          "internalType": "string",
          "name": "",
          "type": "string"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getMessageDetails",
      "outputs": [
        {
          "internalType": "string",
          "name": "message",
          "type": "string"
        },
        {
          "internalType": "address",
          "name": "setter",
          "type": "address"
        },
        {
          "internalType": "uint256",
          "name": "timestamp",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "messageSetter",
      "outputs": [
        {
          "internalType": "address",
          "name": "",
          "type": "address"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "messageTimestamp",
      "outputs": [
        {
          "internalType": "uint256",
          "name": "",
          "type": "uint256"
        }
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {
          "internalType": "string",
          "name": "_newMessage",
          "type": "string"
        }
      ],
      "name": "setMessage",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    }
  ];

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        
        setProvider(provider);
        setSigner(signer);
        setAccount(accounts[0]);
        
        // Initialize contract
        const contractInstance = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        setContract(contractInstance);
        
        setError('');
      } else {
        setError('Please install MetaMask!');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Load current message
  const loadMessage = async () => {
    if (!contract) return;
    
    try {
      setLoading(true);
      const [message, setter, timestamp] = await contract.getMessageDetails();
      setCurrentMessage(message);
      setMessageSetter(setter);
      setMessageTimestamp(Number(timestamp));
      setError('');
    } catch (err) {
      setError('Error loading message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Set new message
  const handleSetMessage = async () => {
    if (!contract || !newMessage.trim()) return;
    
    try {
      setLoading(true);
      const tx = await contract.setMessage(newMessage);
      await tx.wait();
      
      // Reload message after successful transaction
      await loadMessage();
      setNewMessage('');
      setError('');
    } catch (err) {
      setError('Error setting message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load message when contract is available
  useEffect(() => {
    if (contract) {
      loadMessage();
    }
  }, [contract]);

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Message Storage DApp
            </h1>
            <p className="text-blue-200">Day 1 - Your First Smart Contract</p>
          </div>

          {/* Connection Status */}
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
            {!account ? (
              <div className="text-center">
                <button
                  onClick={connectWallet}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Connect Wallet
                </button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-green-300 mb-2">✅ Connected to Base Testnet</p>
                <p className="text-white">Account: {formatAddress(account)}</p>
              </div>
            )}
          </div>

          {/* Current Message */}
          {contract && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Current Message</h2>
              {loading ? (
                <div className="text-blue-200">Loading...</div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-4">
                    <p className="text-white text-lg">{currentMessage || 'No message yet'}</p>
                  </div>
                  {messageSetter && (
                    <div className="text-sm text-blue-200 space-y-1">
                      <p>Set by: {formatAddress(messageSetter)}</p>
                      <p>Timestamp: {formatTimestamp(messageTimestamp)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Set New Message */}
          {contract && (
            <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4">Set New Message</h2>
              <div className="space-y-4">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your message (max 280 characters)"
                  className="w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  maxLength="280"
                />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-blue-200">
                    {newMessage.length}/280 characters
                  </span>
                  <button
                    onClick={handleSetMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white font-bold py-2 px-6 rounded-lg transition-colors"
                  >
                    {loading ? 'Setting...' : 'Set Message'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-500/20 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200">{error}</p>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
            <h3 className="text-yellow-200 font-bold mb-2">⚠️ Important:</h3>
            <p className="text-yellow-100 text-sm">
              Remember to replace "YOUR_CONTRACT_ADDRESS_HERE" with your actual deployed contract address!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageStorageDApp;