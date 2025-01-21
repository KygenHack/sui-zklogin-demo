import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase initialization
const supabaseUrl = "https://hxkmknvxicjqkbkfrguc.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4a21rbnZ4aWNqcWtia2ZyZ3VjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzYyODAyNDEsImV4cCI6MjA1MTg1NjI0MX0.hW77UDF-v8Q04latr7TktoUC1b-6Qeo64ZSXBvtEFmg";
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

// SuisitMiner interface
export interface SuisitMiner {
  id: number;
  userName?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  isBot?: boolean;
  isPremium?: boolean;
  languageCode?: string;
  balance: number;
  miningLevel: number;
  energy: number;
  rewards: number;
  lastHarvestTime?: number;
  lastExhaustedTime?: number;
  lastEnergyDepletionTime?: number;
  cooldownEndTime?: number;
  referrerId?: number;
  referredPlayers?: number[];
  lastLoginDate?: string;
  loginStreak?: number;
  lastUpdated: number;
  walletAddress: string;
  jwtToken: string;
  userSalt: string;
  maxEpoch: number;
  email?: string;
  referralLevel?: number; // Add referral level
}

export interface Referral {
  id: number;
  referrerId: number;
  referredId: number;
  referralLevel: number;
  rewardAmount: number;
  createdAt: string;
}

const MAX_REFERRAL_LEVEL = 5;
const REFERRAL_REWARDS = [0.10, 0.08, 0.05, 0.03, 0.01];

export const addReferral = async (referrerId: number, referredId: number, referrerUsername: string, referredUsername: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("referrals")
      .insert({
        referrer_id: referrerId,
        referrer_username: referrerUsername,
        referred_id: referredId,
        referred_username: referredUsername,
      });

    if (error) {
      throw new Error(error.message);
    }
    console.log(`Referral saved: ${referrerUsername} referred ${referredUsername}`);
  } catch (error) {
    console.error("Error saving referral:", error);
  }
};

export const getReferralsByPlayer = async (referrerId: number): Promise<{ referred_id: number; referred_username: string }[]> => {
  try {
    const { data, error } = await supabase
      .from("referrals")
      .select("referred_id, referred_username")
      .eq("referrer_id", referrerId);

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching referrals from Supabase:", error);
    return [];
  }
};


export const updateReferralLevels = async (referrerId: number, referredId: number): Promise<void> => {
  try {
    // Fetch referrer's data
    const { data: referrerData, error: referrerError } = await supabase
      .from('suisit_profiles')
      .select('referralLevel, balance')
      .eq('id', referrerId)
      .single();

    if (referrerError) throw referrerError;

    // Calculate new referral level
    const currentLevel = referrerData?.referralLevel || 0;
    const newReferralLevel = Math.min(currentLevel + 1, MAX_REFERRAL_LEVEL);

    // Calculate reward
    const rewardPercentage = REFERRAL_REWARDS[newReferralLevel - 1] || 0;
    const rewardAmount = 1 * rewardPercentage; // Assuming 1 SUI is rewarded and multiplied by the percentage
    const newBalance = (referrerData?.balance || 0) + rewardAmount;

    // Update referrer's data in suisit_profiles
    const { error: updateReferrerError } = await supabase
      .from('suisit_profiles')
      .update({ 
        referralLevel: newReferralLevel,
        balance: newBalance
      })
      .eq('id', referrerId);

    if (updateReferrerError) throw updateReferrerError;

    // Insert new referral record
    const { error: insertReferralError } = await supabase
      .from('referrals')
      .insert({
        referrerId,
        referredId,
        referralLevel: newReferralLevel,
        rewardAmount,
        createdAt: new Date().toISOString()
      });

    if (insertReferralError) throw insertReferralError;

    // Update referral levels
    for (let level = 1; level <= newReferralLevel; level++) {
      const { data: levelData, error: levelError } = await supabase
        .from('referral_levels')
        .select('members')
        .eq('referrer_id', referrerId)
        .eq('level', level)
        .single();

      if (levelError && levelError.code !== 'PGRST116') throw levelError;

      let members = levelData ? levelData.members : [];
      if (level === 1) {
        members.push(referredId);
      }

      await supabase
        .from('referral_levels')
        .upsert({
          referrer_id: referrerId,
          level,
          members,
          reward_percentage: REFERRAL_REWARDS[level - 1]
        });
    }
    // Update referred player's referral level in suisit_profiles
    const { error: updateReferredError } = await supabase
      .from('suisit_profiles')
      .update({ referralLevel: 1 })
      .eq('id', referredId);

    if (updateReferredError) throw updateReferredError;

    console.log(`Referral successful. Referrer (ID: ${referrerId}) now at level ${newReferralLevel} with reward ${rewardAmount} SUI`);
  } catch (error) {
    console.error('Error updating referral levels:', error);
  }
}

// Modify the createOrUpdatePlayerProfile function
export const createOrUpdatePlayerProfile = async (playerData: Partial<SuisitMiner>): Promise<SuisitMiner | null> => {
  try {
    const { data, error } = await supabase
      .from('suisit_profiles')
      .upsert(
        { 
          ...playerData,
          lastUpdated: Math.floor(Date.now() / 1000) // Convert to UNIX timestamp (seconds)
        },
        { onConflict: 'walletAddress' }
      )
      .select();

    if (error) throw error;

    const updatedPlayer = data[0];

    if (updatedPlayer && playerData.referrerId) {
      // Fetch referrer's data
      const { data: referrerData, error: referrerError } = await supabase
        .from('suisit_profiles')
        .select('userName')
        .eq('id', playerData.referrerId)
        .single();

      if (referrerError) throw referrerError;

      if (referrerData) {
        await addReferral(
          playerData.referrerId,
          updatedPlayer.id,
          referrerData.userName || 'Unknown',
          updatedPlayer.userName || 'Unknown'
        );

        // Update referral levels
        await updateReferralLevels(playerData.referrerId, updatedPlayer.id);
      }
    }

    return updatedPlayer || null;
  } catch (error) {
    console.error('Error creating/updating player profile:', error);
    return null;
  }
};

export const getPlayerProfile = async (walletAddress: string): Promise<SuisitMiner | null> => {
  try {
    const { data, error } = await supabase
      .from('suisit_profiles')
      .select('*')
      .eq('walletAddress', walletAddress);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching player profile:', error);
    return null;
  }
};

export const createPlayerProfile = async (
  zkLoginData: Partial<SuisitMiner>,
  telegramData: Partial<SuisitMiner>
): Promise<SuisitMiner | null> => {
  const combinedData: Partial<SuisitMiner> = {
    ...zkLoginData,
    ...telegramData,
    lastUpdated: Math.floor(Date.now() / 1000), // Convert to UNIX timestamp (seconds)
  };

  return await createOrUpdatePlayerProfile(combinedData);
};

export const loginAndSavePlayer = async (
  zkLoginData: Partial<SuisitMiner>,
  telegramData: Partial<SuisitMiner>
): Promise<SuisitMiner | null> => {
  try {
    const player = await createPlayerProfile(zkLoginData, telegramData);
    if (player) {
      console.log('Player logged in and saved successfully:', player);
      return player;
    } else {
      console.error('Failed to login and save player');
      return null;
    }
  } catch (error) {
    console.error('Error logging in and saving player:', error);
    return null;
  }
};


export const getReferralLevelMembers = async (referrerId: number, level: number): Promise<number[]> => {
  const { data, error } = await supabase
    .from('referral_levels')
    .select('members')
    .eq('referrer_id', referrerId)
    .eq('level', level)
    .single();

  if (error) throw error;
  return data?.members || [];
};
export const getAllReferralLevels = async (referrerId: number): Promise<{ level: number; members: number[] }[]> => {
  try {
    const levels = [];
    for (let level = 1; level <= MAX_REFERRAL_LEVEL; level++) {
      const members = await getReferralLevelMembers(referrerId, level);
      levels.push({ level, members });
    }
    return levels;
  } catch (error) {
    console.error('Error fetching all referral levels:', error);
    return [];
  }
};
