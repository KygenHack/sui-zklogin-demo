import React, { useState, useEffect, useMemo } from 'react';
import { useMining } from '../hooks/useMining';

interface IdleStakingGameProps {
  walletAddress: string;
}

export const IdleStakingGame: React.FC<IdleStakingGameProps> = ({ walletAddress }) => {
  const { player, updatePlayerProfile } = useMining(walletAddress);
  const [stakeAmount, setStakeAmount] = useState('');
  const [simulatedStake, setSimulatedStake] = useState(0);
  const [simulationDays, setSimulationDays] = useState(30);
  const [activeEarningSimulatorBalance, setActiveEarningSimulatorBalance] = useState(0);

  const calculateDailyRate = useMemo(() => {
    if (!player) return 0;
    const days = Math.min(Math.floor(player.miningLevel / 5) * 5, 100);
    return Math.min(1 + (days * 0.5) / 5, 4);
  }, [player]);

  const dailyEarnings = useMemo(() => {
    if (!player || !stakeAmount) return 0;
    const dailyRate = calculateDailyRate / 100;
    return Number(stakeAmount) * dailyRate;
  }, [stakeAmount, calculateDailyRate, player]);

  const potentialEarningsIn30Days = useMemo(() => {
    if (!player || !stakeAmount) return 0;
    const dailyRate = calculateDailyRate / 100;
    let earnings = 0;
    let simulated = Number(stakeAmount);
    for (let i = 0; i < 30; i++) {
      earnings += simulated * dailyRate;
      simulated += simulated * dailyRate;
    }
    return earnings;
  }, [stakeAmount, calculateDailyRate, player]);

  useEffect(() => {
    if (!player) return;
    const dailyRate = calculateDailyRate / 100;
    let simulated = Number(stakeAmount);
    for (let i = 0; i < simulationDays; i++) {
      simulated += simulated * dailyRate;
    }
    setSimulatedStake(simulated);
  }, [stakeAmount, simulationDays, calculateDailyRate, player]);

  useEffect(() => {
    if (!player) return;
    const interval = setInterval(() => {
      setActiveEarningSimulatorBalance(prev => prev + dailyEarnings);
    }, 60 * 1000); // Update every 60 seconds for testing

    return () => clearInterval(interval);
  }, [dailyEarnings, player]);
  const handleStake = async () => {
    if (player && Number(stakeAmount) >= 1 && Number(stakeAmount) <= player.balance) {
      console.log(`Staking ${stakeAmount} SUI`);

      // Deduct the staked amount from the player's balance
      const newBalance = player.balance - Number(stakeAmount);

      // Update the player's profile with the new balance and total staked amount
      await updatePlayerProfile({ 
        balance: newBalance,
        rewards: player.rewards + Number(stakeAmount) // Assuming rewards field is used for total staked
      });

      // Optionally, reset the stake amount input
      setStakeAmount('');
    } else {
      console.error('Insufficient balance to stake or invalid stake amount');
    }
  };

  const updateRewards = async () => {
    if (!player) return;
    const dailyRate = calculateDailyRate / 100;
    const newRewards = player.rewards + (player.rewards * dailyRate); // Assuming rewards field is used for total staked
    await updatePlayerProfile({ rewards: newRewards });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      updateRewards();
    }, 60 * 1000); // Update rewards every 60 seconds for testing

    return () => clearInterval(interval);
  }, [player, calculateDailyRate]);

  if (!player) return <div>Loading...</div>;
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
            <span className="text-lg font-bold text-white">{calculateDailyRate}%</span>
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

        <div>
          <label className="text-sm text-white/60 mb-2 block">Simulation Days</label>
          <input
            type="number"
            value={simulationDays}
            onChange={(e) => setSimulationDays(Number(e.target.value))}
            min="1"
            max="365"
            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40"
            placeholder="Enter number of days"
          />
        </div>

        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Simulated Stake after {simulationDays} days</span>
            <span className="text-sm font-medium text-white">
              {simulatedStake.toFixed(2)} SUI
            </span>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Daily Earnings</span>
            <span className="text-sm font-medium text-white">
              {dailyEarnings.toFixed(2)} SUI
            </span>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Potential Earnings in 30 Days</span>
            <span className="text-sm font-medium text-white">
              {potentialEarningsIn30Days.toFixed(2)} SUI
            </span>
          </div>
        </div>

        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Active Earning Simulator Balance</span>
            <span className="text-sm font-medium text-white">
              {activeEarningSimulatorBalance.toFixed(2)} SUI
            </span>
          </div>
        </div>
        <button 
          onClick={handleStake}
          disabled={Number(stakeAmount) < 1 || Number(stakeAmount) > player.balance}
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

        <div className="bg-black/20 rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-white/60">Available Balance</span>
            <span className="text-sm font-medium text-white">
              {player.balance ? player.balance.toFixed(2) : '0.00'} SUI
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

