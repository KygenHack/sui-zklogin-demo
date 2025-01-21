import { useState } from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { FaTwitter, FaTelegram, FaCopy } from 'react-icons/fa';

export const NetworkTab = () => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [] = useState<{ referred_id: number; referred_username: string }[]>([]);
  const [levelMembers, ] = useState<number[]>([]);
  const [referralLink, ] = useState('');

  return (
    <div className="flex-1 sm:p-6 space-y-6">
      {/* Referral Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-[#1a1a2e] to-[#2d1f31] rounded-2xl p-6 shadow-xl">
          <h3 className="text-xl font-semibold text-white mb-4">Your Referral Link</h3>
          <div className="bg-black/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={referralLink}
                readOnly
                className="bg-transparent text-gray-300 text-sm flex-1 outline-none"
              />
              <Tooltip title="Copy Link">
                <IconButton
                  onClick={() => navigator.clipboard.writeText(referralLink)}
                  className="text-white hover:text-[#0066FF] transition-colors"
                >
                  <FaCopy size={20} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">
              Share this link to earn rewards from referrals
            </span>
            <div className="flex gap-2">
              <Tooltip title="Share on Twitter">
                <IconButton
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Join me on SuiStakeIt! ${referralLink}`)}`, '_blank')}
                  className="bg-white/10 hover:bg-white/20 text-white hover:text-[#1DA1F2] rounded-full p-2 transition-colors"
                >
                  <FaTwitter size={20} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Share on Telegram">
                <IconButton
                  onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on SuiStakeIt!')}`, '_blank')}
                  className="bg-white/10 hover:bg-white/20 text-white hover:text-[#0088cc] rounded-full p-2 transition-colors"
                >
                  <FaTelegram size={20} />
                </IconButton>
              </Tooltip>
            </div>
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

        {/* Display Level Members */}
        <div className="text-center py-8 bg-black/20 rounded-xl">
          {levelMembers.length > 0 ? (
            <ul className="text-gray-400">
              {levelMembers.map((memberId) => (
                <li key={memberId}>Member ID: {memberId}</li>
              ))}
            </ul>
          ) : (
            <span className="text-gray-400">
              No Level {selectedLevel} referrals
            </span>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-black/20 rounded-xl p-4">
            <span className="text-gray-400 text-sm">Level {selectedLevel} Referrals</span>
            <span className="text-xl font-bold text-white block mt-1">{levelMembers.length}</span>
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