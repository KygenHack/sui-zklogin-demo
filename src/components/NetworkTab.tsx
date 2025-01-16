import { useState } from 'react';
import { Button } from '@mui/material';
import { FaCoins, FaExternalLinkAlt } from 'react-icons/fa';

// const getRankTier = (rank: number) => {
//   const tiers = ['Starter', 'Visionary', 'Pioneer', 'Accumulator', 'Elite', 'Legendary', 'Supreme'];
//   return tiers[rank] || 'Unranked';
// };

export const NetworkTab = () => {
  const [selectedLevel, setSelectedLevel] = useState(1);

  return (
    <div className="flex-1 sm:p-6 space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bonus Stats */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1f31] rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="grid grid-cols-2 gap-4">
            {/* Total Paid Out */}
            <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <FaCoins className="text-green-500 text-xl" />
                </div>
                <span className="text-gray-400">Total paid out</span>
              </div>
              <span className="text-2xl font-bold text-white tabular-nums">$0</span>
              <span className="text-sm text-gray-400 block mt-1">0 SUI</span>
            </div>

            {/* Expected Rank Bonus */}
            <div className="bg-black/20 rounded-2xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                  <FaCoins className="text-yellow-500 text-xl" />
                </div>
                <span className="text-gray-400">Expected bonus</span>
              </div>
              <span className="text-2xl font-bold text-white tabular-nums">$0</span>
              <span className="text-sm text-gray-400 block mt-1">0 SUI</span>
            </div>
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1f31] rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-200">Your Referral Link</span>
            <Button
              size="small"
              className="bg-[#0066FF] text-white rounded-full px-4 py-2"
            >
              Copy
            </Button>
          </div>
          <div className="bg-black/20 rounded-xl p-3 flex items-center gap-2 backdrop-blur-sm">
            <span className="text-gray-400 text-sm truncate flex-1">
              https://t.me/SUI_Stake_It_Bot?start=
            </span>
            <Button
              size="small"
              className="bg-white/10 text-white rounded-full p-2"
            >
              <FaExternalLinkAlt className="text-xs" />
            </Button>
          </div>
          <span className="text-sm text-gray-400 block mt-3">
            Share this link to earn rewards from referrals
          </span>
        </div>
      </div>

      {/* Rank Progress */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1f31] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold text-gray-200">Rank Progress</span>
          <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-blue-500/20 text-blue-400 rounded-full">
            Current
          </span>
        </div>
        
        <div className="space-y-4">
          <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 rounded-full" 
              style={{ width: '30%' }}
            />
          </div>
        </div>
      </div>

      {/* Referral Levels */}
      <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1f31] rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <span className="text-lg font-semibold text-gray-200">Referral Levels</span>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <button
                key={level}
                onClick={() => setSelectedLevel(level)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  level === selectedLevel
                    ? 'bg-[#0066FF] text-white'
                    : 'bg-white/10 text-gray-400 hover:bg-white/20'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Empty State */}
        <div className="text-center py-8 bg-black/20 rounded-xl">
          <span className="text-gray-400">
            No Level {selectedLevel} referrals
          </span>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-black/20 rounded-xl p-4">
            <span className="text-gray-400 text-sm">Level {selectedLevel} Referrals</span>
            <span className="text-xl font-bold text-white block mt-1">0</span>
          </div>
          <div className="bg-black/20 rounded-xl p-4">
            <span className="text-gray-400 text-sm">Total Rewards</span>
            <span className="text-xl font-bold text-white block mt-1">0 SUI</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkTab; 