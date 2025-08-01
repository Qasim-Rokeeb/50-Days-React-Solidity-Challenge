import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  MessageSquare, 
  Users, 
  TrendingUp, 
  Clock, 
  User, 
  Send, 
  RefreshCw, 
  Crown, 
  Ban, 
  Eye,
  Filter,
  Search,
  Heart,
  MessageCircle,
  Zap
} from 'lucide-react';

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

export default function MessageBoardDApp() {
  const [account, setAccount] = useState('');
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [stats, setStats] = useState({
    totalMessages: 0,
    uniqueUsers: new Set(),
    owner: '',
    lastActivity: 0
  });
  const [filter, setFilter] = useState('all'); // all, mine, others
  const [searchTerm, setSearchTerm] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [userProfiles, setUserProfiles] = useState(new Map());
  const [showStats, setShowStats] = useState(true);

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
      setContract(contract);

      // Load initial data
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
      
      setIsOwner(messageOwner.toLowerCase() === userAccount.toLowerCase());
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalMessages: totalMessages.toNumber(),
        owner: messageOwner,
        lastActivity: timestamp.toNumber()
      }));

      // Load message history
      await loadMessageHistory(contractInstance);

    } catch (error) {
      console.error('Error loading contract data:', error);
    }
  };

  // Load message history from events
  const loadMessageHistory = async (contractInstance) => {
    try {
      const filter = contractInstance.filters.MessageUpdated();
      const events = await contractInstance.queryFilter(filter, -1000); // Last 1000 blocks
      
      const messageHistory = events.map(event => ({
        id: event.transactionHash + event.logIndex,
        user: event.args.user,
        message: event.args.newMessage,
        timestamp: event.args.timestamp.toNumber(),
        messageNumber: event.args.messageNumber.toNumber(),
        txHash: event.transactionHash,
        blockNumber: event.blockNumber
      })).reverse(); // Most recent first

      setMessages(messageHistory);

      // Update user profiles and stats
      const uniqueUsers = new Set();
      const profiles = new Map();
      
      messageHistory.forEach(msg => {
        uniqueUsers.add(msg.user.toLowerCase());
        
        if (!profiles.has(msg.user.toLowerCase())) {
          profiles.set(msg.user.toLowerCase(), {
            address: msg.user,
            messageCount: 0,
            firstSeen: msg.timestamp,
            lastSeen: msg.timestamp
          });
        }
        
        const profile = profiles.get(msg.user.toLowerCase());
        profile.messageCount++;
        profile.lastSeen = Math.max(profile.lastSeen, msg.timestamp);
      });

      setUserProfiles(profiles);
      setStats(prev => ({
        ...prev,
        uniqueUsers: uniqueUsers
      }));

    } catch (error) {
      console.error('Error loading message history:', error);
    }
  };

  // Set up event listeners
  const setupEventListeners = (contractInstance) => {
    contractInstance.on('MessageUpdated', (user, newMessage, timestamp, messageNumber) => {
      const newMsg = {
        id: Date.now() + Math.random(),
        user: user,
        message: newMessage,
        timestamp: timestamp.toNumber(),
        messageNumber: messageNumber.toNumber(),
        txHash: 'pending',
        blockNumber: 'pending',
        isNew: true
      };
      
      setMessages(prev => [newMsg, ...prev]);
      
      // Update stats
      setStats(prev => {
        const newUniqueUsers = new Set(prev.uniqueUsers);
        newUniqueUsers.add(user.toLowerCase());
        
        return {
          ...prev,
          totalMessages: messageNumber.toNumber(),
          uniqueUsers: newUniqueUsers,
          lastActivity: timestamp.toNumber()
        };
      });

      // Update user profile
      setUserProfiles(prev => {
        const newProfiles = new Map(prev);
        const userKey = user.toLowerCase();
        
        if (!newProfiles.has(userKey)) {
          newProfiles.set(userKey, {
            address: user,
            messageCount: 1,
            firstSeen: timestamp.toNumber(),
            lastSeen: timestamp.toNumber()
          });
        } else {
          const profile = newProfiles.get(userKey);
          profile.messageCount++;
          profile.lastSeen = timestamp.toNumber();
        }
        
        return newProfiles;
      });
    });
  };

  // Post new message
  const handlePostMessage = async () => {
    if (!contract || !newMessage.trim()) return;

    try {
      setLoading(true);
      const tx = await contract.updateMessage(newMessage);
      
      // Show pending state
      const pendingMsg = {
        id: 'pending-' + Date.now(),
        user: account,
        message: newMessage,
        timestamp: Math.floor(Date.now() / 1000),
        messageNumber: stats.totalMessages + 1,
        txHash: tx.hash,
        blockNumber: 'pending',
        isPending: true
      };
      
      setMessages(prev => [pendingMsg, ...prev]);
      setNewMessage('');
      
      await tx.wait();
      
      // Remove pending message (real one will come from event)
      setMessages(prev => prev.filter(msg => msg.id !== pendingMsg.id));
      
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Error posting message: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(msg => {
    // Filter by user
    if (filter === 'mine' && msg.user.toLowerCase() !== account.toLowerCase()) return false;
    if (filter === 'others' && msg.user.toLowerCase() === account.toLowerCase()) return false;
    
    // Filter by search term
    if (searchTerm && !msg.message.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Utility functions
  const formatAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatTimestamp = (timestamp) => new Date(timestamp * 1000).toLocaleString();
  const getTimeAgo = (timestamp) => {
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getUserColor = (address) => {
    const colors = [
      'bg-red-100 text-red-800',
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-pink-100 text-pink-800',
      'bg-indigo-100 text-indigo-800'
    ];
    const index = parseInt(address.slice(-2), 16) % colors.length;
    return colors[index];
  };

  // Get top contributors
  const topContributors = Array.from(userProfiles.values())
    .sort((a, b) => b.messageCount - a.messageCount)
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <MessageSquare className="w-10 h-10 mr-3 text-purple-600" />
            Message Board
          </h1>
          <p className="text-gray-600">Day 4 Exercise: Real-time Multi-User Messaging</p>
        </div>

        {!account ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <Users className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-4">Join the Conversation</h2>
            <p className="text-gray-600 mb-6">Connect your wallet to start posting messages</p>
            <button
              onClick={connectWallet}
              className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Connect Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* User Info & Post */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getUserColor(account)}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{formatAddress(account)}</p>
                      {isOwner && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center w-fit">
                          <Crown className="w-3 h-3 mr-1" />
                          Owner
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    {userProfiles.get(account.toLowerCase())?.messageCount || 0} messages posted
                  </div>
                </div>

                <div className="space-y-3">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="What's on your mind? (max 280 characters)"
                    maxLength={280}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">{newMessage.length}/280</span>
                    <button
                      onClick={handlePostMessage}
                      disabled={loading || !newMessage.trim()}
                      className="bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Post
                    </button>
                  </div>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center space-x-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="all">All Messages</option>
                      <option value="mine">My Messages</option>
                      <option value="others">Others' Messages</option>
                    </select>
                  </div>
                  
                  <div className="flex items-center space-x-2 flex-1 max-w-md">
                    <Search className="w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search messages..."
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="bg-white rounded-xl shadow-lg">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold flex items-center">
                    <MessageCircle className="w-5 h-5 mr-2 text-purple-600" />
                    Messages ({filteredMessages.length})
                  </h2>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {filteredMessages.length > 0 ? (
                    <div className="divide-y divide-gray-100">
                      {filteredMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`p-4 hover:bg-gray-50 transition-colors ${
                            msg.isNew ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                          } ${msg.isPending ? 'opacity-70' : ''}`}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getUserColor(msg.user)}`}>
                              {msg.user.slice(2, 4).toUpperCase()}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-sm">
                                    {formatAddress(msg.user)}
                                  </span>
                                  {msg.user.toLowerCase() === stats.owner.toLowerCase() && (
                                    <Crown className="w-3 h-3 text-yellow-500" />
                                  )}
                                  {msg.isPending && (
                                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                      Pending
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{getTimeAgo(msg.timestamp)}</span>
                                  <span>#{msg.messageNumber}</span>
                                </div>
                              </div>
                              
                              <p className="text-gray-800 mb-2">{msg.message}</p>
                              
                              {msg.txHash !== 'pending' && (
                                <div className="text-xs text-gray-500">
                                  <span className="font-mono">{msg.txHash.slice(0, 10)}...</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No messages found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                    Stats
                  </h3>
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
                
                {showStats && (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Messages</span>
                      <span className="font-semibold">{stats.totalMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Users</span>
                      <span className="font-semibold">{stats.uniqueUsers.size}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Activity</span>
                      <span className="font-semibold text-sm">
                        {stats.lastActivity ? getTimeAgo(stats.lastActivity) : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Top Contributors */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="font-semibold mb-4 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-600" />
                  Top Contributors
                </h3>
                
                <div className="space-y-3">
                  {topContributors.map((user, index) => (
                    <div key={user.address} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getUserColor(user.address)}`}>
                          {user.address.slice(2, 4).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium">
                          {formatAddress(user.address)}
                        </span>
                        {user.address.toLowerCase() === stats.owner.toLowerCase() && (
                          <Crown className="w-3 h-3 text-yellow-500" />
                        )}
                      </div>
                      <span className="text-sm font-semibold text-purple-600">
                        {user.messageCount}
                      </span>
                    </div>
                  ))}
                  
                  {topContributors.length === 0 && (
                    <p className="text-gray-500 text-sm text-center py-4">
                      No contributors yet
                    </p>
                  )}
                </div>
              </div>

              {/* Network Info */}
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                <h3 className="font-semibold mb-2">Network</h3>
                <p className="text-sm opacity-90">Base Sepolia Testnet</p>
                <p className="text-xs opacity-75 mt-2">
                  Contract: {formatAddress(CONTRACT_ADDRESS)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}