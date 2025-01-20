import React, { useState } from 'react';
import { useMining } from '../hooks/useMining';

interface IdleStakingGameProps {
  walletAddress: string;
}

export const IdleStakingGame: React.FC<IdleStakingGameProps> = ({ walletAddress }) => {
  const { player } = useMining(walletAddress);
  const [stakeAmount, setStakeAmount] = useState('');

  if (!player) return <div>Loading...</div>;

  const calculateDailyRate = () => {
    const days = Math.min(Math.floor(player.miningLevel / 5) * 5, 100);
    return Math.min(1 + (days * 0.5) / 5, 4);
  };

  const handleStake = () => {
    // Implement staking logic here
    console.log(`Staking ${stakeAmount} SUI`);
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/20 rounded-xl p-4">
          <span className="text-sm text-white/60">Days Staked</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-white">{player.miningLevel}</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <span className="text-sm text-white/60">Daily Rate</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-white">{calculateDailyRate()}%</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-2 block">Amount to Stake (min 1 SUI)</label>
          <input
            type="number"
            value={stakeAmount}
            onChange={(e) => setStakeAmount(e.target.value)}
            min="1"
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40"
            placeholder="Enter SUI amount"
          />
        </div>

        <button 
          onClick={handleStake}
          disabled={Number(stakeAmount) < 1}
          className="w-full bg-gradient-to-r from-[#0066FF] to-blue-600 hover:from-[#0052cc] hover:to-blue-700 text-white rounded-xl px-6 py-4 font-medium transition-all duration-300 disabled:opacity-50"
        >
          Stake SUI
        </button>

        <div className="bg-black/20 rounded-xl p-4">
  <div className="flex justify-between items-center">
    <span className="text-sm text-white/60">Total Staked</span>
    <span className="text-sm font-medium text-white">
      {player.rewards ? player.rewards.toFixed(2) : '0.00'} SUI
    </span>
  </div>
</div>
      </div>
    </div>
  );
};