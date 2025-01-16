import { useState } from 'react';
import { Button } from '@mui/material';
import { FaExternalLinkAlt } from 'react-icons/fa';

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