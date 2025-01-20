import { useState, useEffect } from 'react';
import { createOrUpdatePlayerProfile, getPlayerProfile, SuisitMiner } from './playerSuperbase';

export const useMining = (walletAddress: string) => {
  const [player, setPlayer] = useState<SuisitMiner | null>(null);
  const [mining, setMining] = useState(false);

  const ENERGY_REGEN_RATE = 1; // energy per minute
  const MAX_ENERGY = 100;
  const BASE_MINING_RATE = 0.1; // tokens per second
  
  const startMining = async () => {
    if (!player || player.energy <= 0) return;
    setMining(true);
    updatePlayerProfile({ lastHarvestTime: Date.now() });
  };

  const stopMining = () => {
    setMining(false);
    calculateRewards();
  };

  const calculateRewards = async () => {
    if (!player || !player.lastHarvestTime) return;
    
    const miningDuration = (Date.now() - player.lastHarvestTime) / 1000;
    const miningBonus = 1 + (player.miningLevel * 0.1);
    const rewards = BASE_MINING_RATE * miningDuration * miningBonus;
    
    await updatePlayerProfile({
      rewards: player.rewards + rewards,
      energy: Math.max(0, player.energy - (miningDuration / 60)),
      lastHarvestTime: Date.now()
    });
  };

  const updatePlayerProfile = async (updates: Partial<SuisitMiner>) => {
    const updatedPlayer = await createOrUpdatePlayerProfile({
      walletAddress,
      ...updates
    });
    if (updatedPlayer) setPlayer(updatedPlayer);
  };

  useEffect(() => {
    const loadPlayer = async () => {
      const playerData = await getPlayerProfile(walletAddress);
      if (playerData) setPlayer(playerData);
      else {
        // Initialize new player
        const newPlayer = await createOrUpdatePlayerProfile({
          walletAddress,
          balance: 0,
          miningLevel: 1,
          energy: MAX_ENERGY,
          rewards: 0,
          lastUpdated: Date.now()
        });
        if (newPlayer) setPlayer(newPlayer);
      }
    };
    loadPlayer();
  }, [walletAddress]);

  return {
    player,
    mining,
    startMining,
    stopMining,
    updatePlayerProfile
  };
};
