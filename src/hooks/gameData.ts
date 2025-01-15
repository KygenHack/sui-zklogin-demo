// import { BatteryCharging, Clock, HandIcon, TrendingUp, Zap, ZapIcon } from "lucide-react";
// import { LucideIcon } from 'lucide-react';

// export interface Task {
//     isNew: any;
//     id: string;
//     description: string;
//     reward: number;
//     completed: boolean;
//     status: string;
//     requiredLevel?: number;
//     platform?: string;
//     link?: string;
//     progress?: {
//       current: number;
//       total: number;
//     };
//     timeLimit?: string;
//     gameplayRequirement?: string;
//     difficulty?: 'Easy' | 'Medium' | 'Hard';
//     socialAction?: string;
//     verificationMethod?: string;
//     cooldownEndTime: number;
//     updated_at: string;
// }

// export interface UpgradeItem {
//   id: string;
//   name: string;
//   baseCost: number;
//   effect: string;
//   icon: LucideIcon;
//   maxLevel: number;
//   resetHours: number;
//   bonus?: (level: number) => number;
//   miningInterval?: number;
//   energyCost?: number;
//   catchInterval?: number;
// }

// export interface LevelInfo {
//     name: string;
//     level: number;
//     minBalance: number;
//     maxBalance: number;
// }

// export interface UpgradeItemLevel {
//   level: number;
//   lastResetTime: number;
// }

// export interface UpgradeLevels {
//   energyBoost: UpgradeItemLevel;
//   regenerationRate: UpgradeItemLevel;
//   cooldownReduction: UpgradeItemLevel;
//   doubleRewards: UpgradeItemLevel;
//   comboTimeExtension: UpgradeItemLevel;
//   instantEnergyRefill: UpgradeItemLevel;
//   autoCatcher: UpgradeItemLevel;
//   [key: string]: UpgradeItemLevel;
// }


// export const initializeUpgradeLevels = (dbUpgradeLevels: { [key: string]: UpgradeItemLevel } | undefined): UpgradeLevels => {
//   return {
//     energyBoost: dbUpgradeLevels?.energyBoost || { level: 0, lastResetTime: 0 },
//     regenerationRate: dbUpgradeLevels?.regenerationRate || { level: 0, lastResetTime: 0 },
//     cooldownReduction: dbUpgradeLevels?.cooldownReduction || { level: 0, lastResetTime: 0 },
//     doubleRewards: dbUpgradeLevels?.doubleRewards || { level: 0, lastResetTime: 0 },
//     comboTimeExtension: dbUpgradeLevels?.comboTimeExtension || { level: 0, lastResetTime: 0 },
//     instantEnergyRefill: dbUpgradeLevels?.instantEnergyRefill || { level: 0, lastResetTime: 0 },
//     autoCatcher: dbUpgradeLevels?.autoCatcher || { level: 0, lastResetTime: 0 },
//   };
// };


// export const upgradeItems: UpgradeItem[] = [
//   {
//     id: '1',
//     name: 'Energy Capacity',
//     baseCost: 1000,
//     effect: 'Increase max energy by 15',
//     icon: BatteryCharging,
//     maxLevel: 10,
//     resetHours: 24,
//   },
//   {
//     id: '2',
//     name: 'Quick Recovery',
//     baseCost: 2000,
//     effect: 'Reduce cooldown time by 15 minutes',
//     icon: Clock,
//     maxLevel: 5,
//     resetHours: 24,
//   },
//   {
//     id: '3',
//     name: 'Fortune Boost',
//     baseCost: 3000,
//     effect: 'Increase scorpion rewards by 25% for 2 hours',
//     icon: Zap,
//     maxLevel: 3,
//     resetHours: 72,
//   },
//   {
//     id: '4',
//     name: 'Combo Master',
//     baseCost: 2500,
//     effect: 'Increase combo time limit by 8 seconds',
//     icon: TrendingUp,
//     maxLevel: 5,
//     resetHours: 24,
//   },
//   {
//     id: '5',
//     name: 'Instant Energy Refill',
//     baseCost: 3000,
//     effect: 'Instantly refill energy and remove cooldown',
//     icon: ZapIcon,
//     maxLevel: 20,
//     resetHours: 72,
//   },
//   {
//     id: '6',
//     name: 'Energy Surge',
//     baseCost: 400,
//     effect: 'Get 30 minutes of no cooldown',
//     icon: ZapIcon,
//     maxLevel: 1,
//     resetHours: 72,
//   },
//   {
//     id: '7',
//     name: 'Lucky Charm',
//     baseCost: 5000,
//     effect: 'Increase chance of finding rare scorpions by 5%',
//     icon: ZapIcon,
//     maxLevel: 5,
//     resetHours: 72,
//   },
//   {
//     id: '8',
//     name: 'Auto Catcher',
//     effect: 'Automatically catches scorpions every second',
//     baseCost: 150000,
//     maxLevel: 5,
//     icon: HandIcon,
//     resetHours: 24,
//     bonus: (level: number) => level * 2,
//     catchInterval: 1000,
//     energyCost: 2,
//   },
// ];

// export interface Level {
//     name: string;
//     minBalance: number;
//     maxBalance: number;
//     level: number;
// }

// export const levels: Level[] = [
//     { name: 'Novice Miner', minBalance: 0, maxBalance: 999, level: 1 },
//     { name: 'Apprentice Miner', minBalance: 1000, maxBalance: 4999, level: 2 },
//     { name: 'Skilled Miner', minBalance: 5000, maxBalance: 24999, level: 3 },
//     { name: 'Advanced Miner', minBalance: 25000, maxBalance: 99999, level: 4 },
//     { name: 'Expert Miner', minBalance: 100000, maxBalance: 249999, level: 5 },
//     { name: 'Master Miner', minBalance: 250000, maxBalance: 499999, level: 6 },
//     { name: 'Elite Miner', minBalance: 500000, maxBalance: 999999, level: 7 },
//     { name: 'Veteran Miner', minBalance: 1000000, maxBalance: 2499999, level: 8 },
//     { name: 'Legendary Miner', minBalance: 2500000, maxBalance: 4999999, level: 9 },
//     { name: 'Mythical Miner', minBalance: 5000000, maxBalance: 9999999, level: 10 },
//     { name: 'Divine Miner', minBalance: 10000000, maxBalance: 24999999, level: 11 },
//     { name: 'Celestial Miner', minBalance: 25000000, maxBalance: 49999999, level: 12 },
//     { name: 'Transcendent Miner', minBalance: 50000000, maxBalance: 99999999, level: 13 },
//     { name: 'Immortal Miner', minBalance: 100000000, maxBalance: 499999999, level: 14 },
//     { name: 'Eternal Miner', minBalance: 500000000, maxBalance: Infinity, level: 15 }
// ];

// export const getLevel = (balance: number): LevelInfo => {
//     for (let i = 0; i < levels.length; i++) {
//       if (balance >= levels[i].minBalance && (i === levels.length - 1 || balance < levels[i + 1].minBalance)) {
//         return { name: levels[i].name, level: levels[i].level, minBalance: levels[i].minBalance, maxBalance: levels[i].maxBalance };
//       }
//     }
//     return { name: 'Unknown', level: 0, minBalance: 0, maxBalance: 0 };
// };