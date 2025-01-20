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
}


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
    return data[0] || null;
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


