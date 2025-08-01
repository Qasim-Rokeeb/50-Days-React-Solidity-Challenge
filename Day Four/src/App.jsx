import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { MessageCircle, User, Clock, Hash, Send, RefreshCw, Shield, AlertCircle } from 'lucide-react';

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
const CONTRACT_ABI = [
  "function message() view returns (string)",
  "function messageCount() view returns (uint256)",
  "function owner() view returns (address)",
  "function lastUpdated() view returns (uint256)",
  "function userMessageCounts(address) view returns (uint256)",
  "function updateMessage(string) payable",
  "function getMessage() view returns (string, address, uint256, uint256)",
  "function getUserMessageCount(address) view returns (uint256)",
  "function transferOwnership(address)",
  "function resetContract(string)",
  "event MessageUpdated(address indexed user, string newMessage, uint256 timestamp, uint256 messageNumber)",
  "event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)"
];

export default function EnhancedMessageStorageDApp() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [message, setMessage] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [owner, setOwner] = useState('');
  const [lastUpdated, setLastUpdated] = useState(0);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [newOwner, setNewOwner] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showOwnerFunctions, setShowOwnerFunctions] = useState(false);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setAccount(accounts[0]);
      setProvider(provider);
      setSigner(signer);
      setContract(contract);

      // Load contract data
      await loadContractData(contract, accounts[0]);
      
      // Set up event listeners
      setupEventListeners(contract);

    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Error connecting wallet: ' + error.message);
    }
  };

  // Load contract data
  const loadContractData = async (contractInstance, userAccount) => {
    try {
      const [currentMessage, messageOwner, totalMessages, timestamp] = await contractInstance.getMessage();
      const userCount = await contractInstance.getUserMessageCount(userAccount);

      setMessage(currentMessage);
      setOwner(messageOwner);
      setMessageCount(totalMessages.toNumber());
      setLastUpdated(timestamp.toNumber());
      setUserMessageCount(userCount.toNumber());
      setShowOwnerFunctions(messageOwner.toLowerCase() === userAccount.toLowerCase());

      // Load recent events
      await loadRecentEvents(contractInstance);

    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  // Set up event listeners
  const setupEventListeners = (contractInstance) => {
    // Listen for MessageUpdated events
    contractInstance.on('MessageUpdated', (user, newMessage, timestamp, messageNumber) => {
      const event = {
        type: 'MessageUpdated',
        user: user,
        message: newMessage,
        timestamp: timestamp.toNumber(),
        messageNumber: messageNumber.toNumber(),
        id: Date.now()
      };
      
      setEvents(prev => [event, ...prev.slice(0, 9)]); // Keep last 10 events
      
      // Update state if it's the current message
      setMessage(newMessage);
      setMessageCount(messageNumber.toNumber());
      setLastUpdated(timestamp.toNumber());
    });

    // Listen for OwnershipTransferred events
    contractInstance.on('OwnershipTransferred', (previousOwner, newOwner) => {
      const event = {
        type: 'OwnershipTransferred',
        previousOwner: previousOwner,
        newOwner: newOwner,
        timestamp: Date.now() / 1000,
        id: Date.now()
      };
      
      setEvents(prev => [event, ...prev.slice(0, 9)]);
      setOwner(newOwner);
      setShowOwnerFunctions(newOwner.toLowerCase() === account.toLowerCase());
    });
  };

  // Load recent events
  const loadRecentEvents = async (contractInstance) => {
    try {
      const filter = contractInstance.filters.MessageUpdated();
      const recentEvents = await contractInstance.queryFilter(filter, -100); // Last 100 blocks
      
      const formattedEvents = recentEvents.slice(-10).reverse().map(event => ({
        type: 'MessageUpdated',
        user: event.args.user,
        message: event.args.newMessage,
        timestamp: event.args.timestamp.toNumber(),
        messageNumber: event.args.messageNumber.toNumber(),
        id: event.transactionHash + event.logIndex
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  // Update message
  const handleUpdateMessage = async () => {
    if (!contract || !newMessage.trim()) return;

    try {
      setLoading(true);
      const tx = await contract.updateMessage(newMessage);
      await tx.wait();
      
      setNewMessage('');
      await loadContractData(contract, account);
    } catch (error) {
      console.error('Error updating message:', error);
      alert('Error updating message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Transfer ownership
  const handleTransferOwnership = async () => {
    if (!contract || !newOwner.trim()) return;

    try {
      setLoading(true);
      const tx = await contract.transferOwnership(newOwner);
      await tx.wait();
      
      setNewOwner('');
      await loadContractData(contract, account);
    } catch (error) {
      console.error('Error transferring ownership:', error);
      alert('Error transferring ownership: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset contract
  const handleResetContract = async () => {
    if (!contract || !resetMessage.trim()) return;

    if (!confirm('Are you sure you want to reset the contract? This will clear all message history.')) {
      return;
    }

    try {
      setLoading(true);
      const tx = await contract.resetContract(resetMessage);
      await tx.wait();
      
      setResetMessage('');
      await loadContractData(contract, account);
    } catch (error) {
      console.error('Error resetting contract:', error);
      alert('Error resetting contract: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Format address
  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Enhanced Message Storage</h1>
          <p className="text-gray-600">Day 4: Events, Modifiers & Real-time Updates</p>
        </div>

        {!account ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <MessageCircle className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Connect Your Wallet</h2>
            <p className="text-gray-600 mb-6">Connect your MetaMask wallet to interact with the smart contract</p>
            <button
              onClick={connectWallet}
              className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Account Info */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-500" />
                  <span className="text-sm text-gray-600">Connected Account:</span>
                  <span className="font-mono text-sm">{formatAddress(account)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Your Messages: {userMessageCount}</span>
                  {showOwnerFunctions && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                      <Shield className="w-3 h-3 mr-1" />
                      Owner
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Current Message Display */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Current Message</h2>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    #{messageCount}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {formatTimestamp(lastUpdated)}
                  </div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-lg text-gray-800">{message || 'No message set'}</p>
              </div>
              
              <div className="text-sm text-gray-500">
                <span>Posted by: </span>
                <span className="font-mono">{formatAddress(owner)}</span>
              </div>
            </div>

            {/* Update Message */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Update Message</h2>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your new message (max 280 chars)"
                  maxLength={280}
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleUpdateMessage}
                  disabled={loading || !newMessage.trim()}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">
                {newMessage.length}/280 characters
              </div>
            </div>

            {/* Owner Functions */}
            {showOwnerFunctions && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-4">
                  <Shield className="w-5 h-5 text-yellow-600 mr-2" />
                  <h2 className="text-xl font-semibold text-yellow-800">Owner Functions</h2>
                </div>
                
                <div className="space-y-4">
                  {/* Transfer Ownership */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Transfer Ownership</label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={newOwner}
                        onChange={(e) => setNewOwner(e.target.value)}
                        placeholder="New owner address (0x...)"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                      <button
                        onClick={handleTransferOwnership}
                        disabled={loading || !newOwner.trim()}
                        className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Transfer
                      </button>
                    </div>
                  </div>

                  {/* Reset Contract */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Reset Contract</label>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={resetMessage}
                        onChange={(e) => setResetMessage(e.target.value)}
                        placeholder="New initial message"
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                      />
                      <button
                        onClick={handleResetContract}
                        disabled={loading || !resetMessage.trim()}
                        className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
                      >
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Real-time Events */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              {events.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {events.map((event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-3">
                      {event.type === 'MessageUpdated' ? (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                              Message Updated
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 mb-1">{event.message}</p>
                          <div className="text-xs text-gray-500">
                            By {formatAddress(event.user)} • Message #{event.messageNumber}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                              Ownership Transferred
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            From {formatAddress(event.previousOwner)} to {formatAddress(event.newOwner)}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No recent activity</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}