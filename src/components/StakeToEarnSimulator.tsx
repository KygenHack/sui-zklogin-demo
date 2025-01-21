import React, { useState, useEffect } from 'react';
import { useMining } from '../hooks/useMining';

interface StakeToEarnSimulatorProps {
  walletAddress: string;
}

export const StakeToEarnSimulator: React.FC<StakeToEarnSimulatorProps> = ({ walletAddress }) => {
  const { player, updatePlayerProfile } = useMining(walletAddress);
  const [stakeAmount, setStakeAmount] = useState('');
  const [earnings, setEarnings] = useState(0);
  const [isStaking, setIsStaking] = useState(false);

  const dailyRate = 0.05; // 5% daily rate

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isStaking && player) {
      interval = setInterval(() => {
        const newEarnings = earnings + (Number(stakeAmount) * dailyRate) / 86400; // Simulating earnings every second
        setEarnings(newEarnings);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isStaking, stakeAmount, earnings, player]);

  const handleStake = async () => {
    if (player && Number(stakeAmount) > 0 && Number(stakeAmount) <= player.balance) {
      const newBalance = player.balance - Number(stakeAmount);
      await updatePlayerProfile({ 
        balance: newBalance,
        rewards: player.rewards + Number(stakeAmount)
      });
      setIsStaking(true);
    }
  };

  const handleUnstake = async () => {
    if (player) {
      const totalEarned = player.rewards + earnings;
      await updatePlayerProfile({ 
        balance: player.balance + totalEarned,
        rewards: 0
      });
      setIsStaking(false);
      setEarnings(0);
      setStakeAmount('');
    }
  };

  if (!player) return <div className="text-center text-white">Loading...</div>;

  return (
    <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5">
      <h2 className="text-2xl font-bold text-white mb-4">Stake to Earn</h2>
      
      <div className="space-y-4">
        <div className="bg-white/10 rounded-xl p-4">
          <p className="text-sm text-white/70">Available Balance</p>
          <p className="text-xl font-bold text-white">{player.balance.toFixed(2)} SUI</p>
        </div>

        {!isStaking ? (
          <>
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full bg-white/20 text-white rounded-xl px-4 py-3 placeholder-white/50"
              placeholder="Enter stake amount"
            />
            <button
              onClick={handleStake}
              disabled={Number(stakeAmount) <= 0 || Number(stakeAmount) > player.balance}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl py-3 font-medium transition-all duration-300 hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
            >
              Stake SUI
            </button>
          </>
        ) : (
          <div className="space-y-4">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70">Staked Amount</p>
              <p className="text-xl font-bold text-white">{stakeAmount} SUI</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="text-sm text-white/70">Earnings</p>
              <p className="text-xl font-bold text-white">{earnings.toFixed(6)} SUI</p>
            </div>
            <button
              onClick={handleUnstake}
              className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl py-3 font-medium transition-all duration-300 hover:from-red-600 hover:to-orange-600"
            >
              Unstake & Collect
            </button>
          </div>
        )}
      </div>
    </div>
  );
};