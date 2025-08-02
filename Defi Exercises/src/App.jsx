import React, { useState, useEffect } from 'react';
import { Clock, TrendingUp, AlertTriangle, Coins, Plus, Wallet } from 'lucide-react';

const StakingPoolApp = () => {
  const [activeTab, setActiveTab] = useState('stake');
  const [selectedToken, setSelectedToken] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [lockPeriod, setLockPeriod] = useState('7');
  const [customToken, setCustomToken] = useState('');
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState('');
  
  // Mock data - replace with actual contract calls
  const [supportedTokens] = useState([
    { address: '0x123...', symbol: 'USDC', name: 'USD Coin', balance: '1000.00' },
    { address: '0x456...', symbol: 'WETH', name: 'Wrapped Ether', balance: '5.25' },
    { address: '0x789...', symbol: 'DAI', name: 'Dai Stablecoin', balance: '750.50' }
  ]);
  
  const [userStakes] = useState([
    {
      id: 1,
      token: 'USDC',
      amount: '500.00',
      startTime: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
      lockPeriod: 30,
      rewardRate: 12,
      status: 'active'
    },
    {
      id: 2,
      token: 'WETH',
      amount: '2.5',
      startTime: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
      lockPeriod: 90,
      rewardRate: 25,
      status: 'active'
    }
  ]);

  const lockPeriods = [
    { days: 7, apy: 5, label: '7 Days' },
    { days: 30, apy: 12, label: '30 Days' },
    { days: 90, apy: 25, label: '90 Days' }
  ];

  const connectWallet = async () => {
    // Mock wallet connection
    setConnected(true);
    setAccount('0x1234...5678');
  };

  const calculateRewards = (amount, apy, days) => {
    return (parseFloat(amount) * (apy / 100) * (days / 365)).toFixed(4);
  };

  const calculateTimeRemaining = (startTime, lockPeriodDays) => {
    const endTime = startTime + (lockPeriodDays * 24 * 60 * 60 * 1000);
    const remaining = endTime - Date.now();
    
    if (remaining <= 0) return 'Unlocked';
    
    const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
    const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    return `${days}d ${hours}h`;
  };

  const StakeInterface = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Coins className="w-5 h-5 mr-2 text-blue-600" />
          Stake Your Tokens
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Token Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Token
            </label>
            <select
              value={selectedToken}
              onChange={(e) => setSelectedToken(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose a token...</option>
              {supportedTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol} - Balance: {token.balance}
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stake Amount
            </label>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              placeholder="Enter amount..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Lock Period Selection */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Lock Period & APY
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {lockPeriods.map((period) => (
              <div
                key={period.days}
                onClick={() => setLockPeriod(period.days.toString())}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  lockPeriod === period.days.toString()
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="font-semibold text-gray-800">{period.label}</div>
                  <div className="text-2xl font-bold text-blue-600">{period.apy}%</div>
                  <div className="text-sm text-gray-500">APY</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Reward Preview */}
        {stakeAmount && lockPeriod && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Projected Rewards</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Staked Amount:</span>
                <div className="font-semibold">{stakeAmount} {supportedTokens.find(t => t.address === selectedToken)?.symbol}</div>
              </div>
              <div>
                <span className="text-gray-600">Estimated Rewards:</span>
                <div className="font-semibold text-green-600">
                  +{calculateRewards(stakeAmount, lockPeriods.find(p => p.days.toString() === lockPeriod)?.apy || 0, parseInt(lockPeriod))} {supportedTokens.find(t => t.address === selectedToken)?.symbol}
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => console.log('Stake tokens')}
          disabled={!selectedToken || !stakeAmount || !connected}
          className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {!connected ? 'Connect Wallet First' : 'Stake Tokens'}
        </button>
      </div>

      {/* Add Custom Token */}
      <div className="bg-white rounded-xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Token
        </h4>
        <div className="flex gap-3">
          <input
            type="text"
            value={customToken}
            onChange={(e) => setCustomToken(e.target.value)}
            placeholder="Token contract address..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => console.log('Add custom token')}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Add Token
          </button>
        </div>
      </div>
    </div>
  );

  const Portfolio = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Your Staking Portfolio
        </h3>
        
        {userStakes.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No active stakes found</div>
            <button
              onClick={() => setActiveTab('stake')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Start staking →
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {userStakes.map((stake) => (
              <div key={stake.id} className="bg-white rounded-lg p-6 border border-gray-200">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{stake.amount} {stake.token}</h4>
                    <p className="text-gray-600">Lock Period: {stake.lockPeriod} days • APY: {stake.rewardRate}%</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Time Remaining</div>
                    <div className="font-semibold flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {calculateTimeRemaining(stake.startTime, stake.lockPeriod)}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-gray-600">Staked</div>
                    <div className="font-semibold">{stake.amount} {stake.token}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-gray-600">Earned Rewards</div>
                    <div className="font-semibold text-blue-600">
                      {calculateRewards(stake.amount, stake.rewardRate, Math.floor((Date.now() - stake.startTime) / (24 * 60 * 60 * 1000)))} {stake.token}
                    </div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-gray-600">Total Value</div>
                    <div className="font-semibold text-green-600">
                      {(parseFloat(stake.amount) + parseFloat(calculateRewards(stake.amount, stake.rewardRate, Math.floor((Date.now() - stake.startTime) / (24 * 60 * 60 * 1000))))).toFixed(4)} {stake.token}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                    Claim Rewards
                  </button>
                  <button className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors">
                    Compound
                  </button>
                  <button className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Emergency Withdraw
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Multi-Asset Staking Pool</h1>
              <p className="text-gray-600">Stake your tokens and earn rewards</p>
            </div>
            
            {!connected ? (
              <button
                onClick={connectWallet}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </button>
            ) : (
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Connected</div>
                  <div className="font-medium">{account}</div>
                </div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('stake')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'stake'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Stake Tokens
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'portfolio'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Portfolio
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'stake' && <StakeInterface />}
        {activeTab === 'portfolio' && <Portfolio />}
      </main>
    </div>
  );
};

export default StakingPoolApp;