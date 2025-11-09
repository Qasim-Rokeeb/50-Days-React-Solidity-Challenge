import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { MessageCircle, Send, Edit3, Trash2, Ban, Shield, Clock, User } from 'lucide-react';

// Contract ABI (simplified for key functions)
const CONTRACT_ABI = [
  "function postMessage(string memory _content) external",
  "function editMessage(uint256 _messageId, string memory _newContent) external",
  "function deleteMessage(uint256 _messageId) external",
  "function getRecentMessages(uint256 _count) external view returns (tuple(uint256 id, address author, string content, uint256 timestamp, bool isActive)[])",
  "function getUserMessages(address _user) external view returns (tuple(uint256 id, address author, string content, uint256 timestamp, bool isActive)[])",
  "function getUserMessageCount(address _user) external view returns (uint256)",
  "function messageCount() external view returns (uint256)",
  "function owner() external view returns (address)",
  "function isUserBanned(address _user) external view returns (bool)",
  "function banUser(address _user) external",
  "function unbanUser(address _user) external",
  "event MessagePosted(uint256 indexed messageId, address indexed author, string content, uint256 timestamp)",
  "event MessageEdited(uint256 indexed messageId, address indexed author, string newContent)",
  "event MessageDeleted(uint256 indexed messageId, address indexed author)"
];

// Replace with your deployed contract address
const CONTRACT_ADDRESS = "0xFD3E49E4a4926aFAf28E19bf608C8B47E9980E74"; // Update

export default function MessageBoard() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState('');
  const [messages, setMessages] = useState([]);
  const [userMessages, setUserMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [bannedStatus, setBannedStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [messageCount, setMessageCount] = useState(0);

  // Connect to wallet
  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask!');
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setProvider(provider);
      setSigner(signer);
      setContract(contract);
      setAccount(accounts[0]);

      // Check if user is owner
      const owner = await contract.owner();
      setIsOwner(owner.toLowerCase() === accounts[0].toLowerCase());

      // Check if user is banned
      const banned = await contract.isUserBanned(accounts[0]);
      setBannedStatus(banned);

      await loadMessages(contract);
      await loadUserMessages(contract, accounts[0]);
      setupEventListeners(contract);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Load all messages
  const loadMessages = async (contractInstance = contract) => {
    try {
      const totalMessages = await contractInstance.messageCount();
      setMessageCount(Number(totalMessages));
      
      if (totalMessages > 0) {
        const recentMessages = await contractInstance.getRecentMessages(20);
        setMessages(recentMessages.map(formatMessage));
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  // Load user's messages
  const loadUserMessages = async (contractInstance = contract, userAddress = account) => {
    try {
      const userMsgs = await contractInstance.getUserMessages(userAddress);
      setUserMessages(userMsgs.map(formatMessage));
    } catch (error) {
      console.error('Error loading user messages:', error);
    }
  };

  // Format message data
  const formatMessage = (msg) => ({
    id: Number(msg.id),
    author: msg.author,
    content: msg.content,
    timestamp: Number(msg.timestamp) * 1000,
    isActive: msg.isActive
  });

  // Setup event listeners
  const setupEventListeners = (contractInstance) => {
    contractInstance.on('MessagePosted', (messageId, author, content, timestamp) => {
      const newMsg = {
        id: Number(messageId),
        author,
        content,
        timestamp: Number(timestamp) * 1000,
        isActive: true
      };
      
      setMessages(prev => [newMsg, ...prev]);
      if (author.toLowerCase() === account.toLowerCase()) {
        setUserMessages(prev => [newMsg, ...prev]);
      }
      setMessageCount(prev => prev + 1);
    });

    contractInstance.on('MessageEdited', (messageId, author, newContent) => {
      const id = Number(messageId);
      setMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, content: newContent } : msg
      ));
      setUserMessages(prev => prev.map(msg => 
        msg.id === id ? { ...msg, content: newContent } : msg
      ));
    });

    contractInstance.on('MessageDeleted', (messageId, author) => {
      const id = Number(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== id));
      setUserMessages(prev => prev.filter(msg => msg.id !== id));
    });
  };

  // Post new message
  const postMessage = async () => {
    if (!newMessage.trim() || !contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.postMessage(newMessage);
      await tx.wait();
      setNewMessage('');
    } catch (error) {
      console.error('Error posting message:', error);
      alert('Error posting message: ' + error.message);
    }
    setLoading(false);
  };

  // Start editing message
  const startEdit = (id, content) => {
    setEditingId(id);
    setEditingContent(content);
  };

  // Save edited message
  const saveEdit = async () => {
    if (!editingContent.trim() || !contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.editMessage(editingId, editingContent);
      await tx.wait();
      setEditingId(null);
      setEditingContent('');
    } catch (error) {
      console.error('Error editing message:', error);
      alert('Error editing message: ' + error.message);
    }
    setLoading(false);
  };

  // Delete message
  const deleteMessage = async (id) => {
    if (!contract) return;
    
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    setLoading(true);
    try {
      const tx = await contract.deleteMessage(id);
      await tx.wait();
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Error deleting message: ' + error.message);
    }
    setLoading(false);
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  // Truncate address
  const truncateAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="text-blue-600" size={32} />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">MessageBoard DApp</h1>
                <p className="text-gray-600">Day 2: Advanced Contract Features</p>
              </div>
            </div>
            
            {!account ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Connect Wallet
              </button>
            ) : (
              <div className="text-right">
                <p className="text-sm text-gray-600">Connected:</p>
                <p className="font-mono text-sm">{truncateAddress(account)}</p>
                {isOwner && <span className="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mt-1">
                  <Shield size={12} /> Owner
                </span>}
                {bannedStatus && <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full mt-1">
                  <Ban size={12} /> Banned / Removed
                </span>}
              </div>
            )}
          </div>
          
          {account && (
            <div className="mt-4 flex gap-4 text-sm text-gray-600">
              <span>Total Messages: {messageCount}</span>
              <span>Your Messages: {userMessages.length}</span>
            </div>
          )}
        </div>

        {account && (
          <>
            {/* Post Message Form */}
            {!bannedStatus && (
              <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Post a Message</h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="What's on your mind? (max 280 characters)"
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    maxLength={280}
                    disabled={loading}
                  />
                  <button
                    onClick={postMessage}
                    disabled={loading || !newMessage.trim()}
                    className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send size={20} />
                    {loading ? 'Posting...' : 'Post'}
                  </button>
                </div>
                <div className="text-right text-sm text-gray-500 mt-2">
                  {newMessage.length}/280 characters
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 mb-6">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                All Messages ({messages.length})
              </button>
              <button
                onClick={() => setActiveTab('mine')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'mine' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                My Messages ({userMessages.length})
              </button>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              {(activeTab === 'all' ? messages : userMessages).map((message) => (
                <div key={message.id} className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 mb-3">
                      <User className="text-gray-400" size={20} />
                      <span className="font-mono text-sm text-gray-600">
                        {truncateAddress(message.author)}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                    
                    {message.author.toLowerCase() === account.toLowerCase() && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(message.id, message.content)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => deleteMessage(message.id)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editingId === message.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        maxLength={280}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={loading}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingContent('');
                          }}
                          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-800 leading-relaxed">{message.content}</p>
                  )}
                </div>
              ))}
              
              {(activeTab === 'all' ? messages : userMessages).length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                  <p>No messages found</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}