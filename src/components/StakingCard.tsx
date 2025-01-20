import { useState, useEffect } from 'react';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { MIST_PER_SUI } from '@mysten/sui.js/utils';
import { AiOutlineInfoCircle } from 'react-icons/ai';
import { BigNumber } from 'bignumber.js';
import { ADDRESSES } from '../constant';
import { SuiClient } from "@mysten/sui.js/client";
import { FULLNODE_URL } from "../constant";

interface StakingCardProps {
  zkLoginUserAddress: string;
  addressBalance?: { totalBalance: string };
  handleTransaction: (txb: TransactionBlock) => Promise<void>;
}

const suiClient = new SuiClient({ url: FULLNODE_URL });

export const StakingCard = ({ zkLoginUserAddress, addressBalance, handleTransaction }: StakingCardProps) => {
  const [stakeAmount, setStakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [stakedBalance, setStakedBalance] = useState('0');
  const [apr, setApr] = useState('0');

  useEffect(() => {
    const fetchStakingInfo = async () => {
      try {
        const stakingInfoObject = await suiClient.getObject({
          id: ADDRESSES.LIQUID_STAKING,
          options: { showContent: true }
        });

        if (stakingInfoObject.data?.content && 'fields' in stakingInfoObject.data.content) {
          const fields = stakingInfoObject.data.content.fields as { 
            apr_bps: string;
            total_sui_amount: string;
          };
          const aprBasisPoints = Number(fields.apr_bps || 0);
          const aprPercentage = (aprBasisPoints / 100).toFixed(2);
          setApr(aprPercentage);

          // Also fetch staked balance if available
          const stakedAmount = fields.total_sui_amount || '0';
          setStakedBalance(new BigNumber(stakedAmount).div(MIST_PER_SUI.toString()).toString());
        }
      } catch (error) {
        console.error('Error fetching staking info:', error);
        setApr('0');
      }
    };

    fetchStakingInfo();
    // Refresh every 5 minutes
    const interval = setInterval(fetchStakingInfo, 300000);
    return () => clearInterval(interval);
  }, [zkLoginUserAddress]);

  const handleStake = async () => {
    if (!stakeAmount || loading) return;
    
    try {
      setLoading(true);
      const txb = new TransactionBlock();
      const amountInMist = Number(stakeAmount) * Number(MIST_PER_SUI);

      // Split coin for staking
      const [stakeCoin] = txb.splitCoins(txb.gas, [amountInMist]);
      
      // Call stake function
      txb.moveCall({
        target: `${ADDRESSES.LIQUID_STAKING}::liquid_staking::stake`,
        arguments: [stakeCoin],
      });

      await handleTransaction(txb);
      setStakeAmount('');
    } catch (error) {
      console.error('Staking error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
      {/* Header with APR */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Stake SUI</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-sm text-white/60">APR</span>
            <AiOutlineInfoCircle className="text-white/40 w-4 h-4" />
          </div>
          <span className="text-lg font-bold text-green-400">{apr}%</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/20 rounded-xl p-4">
          <span className="text-sm text-white/60">Available to Stake</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-white">
              {addressBalance ? 
                BigNumber(addressBalance.totalBalance).div(MIST_PER_SUI.toString()).toFixed(4) : 
                '0.0000'
              }
            </span>
            <span className="text-sm text-white/60">SUI</span>
          </div>
        </div>
        <div className="bg-black/20 rounded-xl p-4">
          <span className="text-sm text-white/60">Total Staked</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-lg font-bold text-white">{stakedBalance}</span>
            <span className="text-sm text-white/60">SUI</span>
          </div>
        </div>
      </div>

      {/* Staking Input */}
      <div className="space-y-4">
        <div>
          <label className="text-sm text-white/60 mb-2 block">Amount to Stake</label>
          <div className="relative">
            <input
              type="number"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40"
              placeholder="0.0"
            />
            <button 
              onClick={() => {
                const balance = addressBalance ? 
                  BigNumber(addressBalance.totalBalance).div(MIST_PER_SUI.toString()).toString() : 
                  '0';
                setStakeAmount(balance);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 text-sm font-medium"
            >
              MAX
            </button>
          </div>
        </div>

        {/* Rewards Estimate */}
        {stakeAmount && (
          <div className="bg-black/20 rounded-xl p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-white/60">Estimated Daily Rewards</span>
              <span className="text-sm font-medium text-white">
                {(Number(stakeAmount) * (Number(apr) / 100) / 365).toFixed(6)} SUI
              </span>
            </div>
          </div>
        )}

        <button
          onClick={handleStake}
          disabled={!stakeAmount || loading}
          className="w-full bg-gradient-to-r from-[#0066FF] to-blue-600 hover:from-[#0052cc] hover:to-blue-700 text-white rounded-xl px-6 py-4 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </div>
          ) : (
            'Stake SUI'
          )}
        </button>

        {/* Info Text */}
        <div className="flex items-start gap-2 text-sm text-white/40">
          <AiOutlineInfoCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Staked SUI earns rewards from network fees and transaction processing. 
            Rewards are automatically compounded.
          </p>
        </div>
      </div>
    </div>
  );
};