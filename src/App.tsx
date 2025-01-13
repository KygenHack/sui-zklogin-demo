import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import { fromB64 } from "@mysten/bcs";
import { useSuiClientQuery } from "@mysten/dapp-kit";
import { SuiClient } from "@mysten/sui.js/client";
import { SerializedSignature } from "@mysten/sui.js/cryptography";
import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { MIST_PER_SUI } from "@mysten/sui.js/utils";
import {
  genAddressSeed,
  generateNonce,
  generateRandomness,
  getExtendedEphemeralPublicKey,
  getZkLoginSignature,
  jwtToAddress,
} from "@mysten/zklogin";
import axios from "axios";
import { BigNumber } from "bignumber.js";
import { JwtPayload, jwtDecode } from "jwt-decode";
import { enqueueSnackbar } from "notistack";
import queryString from "query-string";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import "./App.css";
import GoogleLogo from "./assets/google.svg";
import { FaCoins } from 'react-icons/fa';
import { AiOutlineHome, AiOutlineInfoCircle } from 'react-icons/ai';
import { BiNetworkChart } from 'react-icons/bi';
import { RiMessage3Line } from 'react-icons/ri';
import { QRCodeSVG } from 'qrcode.react';
import { FiLogOut } from 'react-icons/fi';
import { initData, useSignal } from '@telegram-apps/sdk-react';

import {
  CLIENT_ID,
  FULLNODE_URL,
  KEY_PAIR_SESSION_STORAGE_KEY,
  MAX_EPOCH_LOCAL_STORAGE_KEY,
  RANDOMNESS_SESSION_STORAGE_KEY,
  REDIRECT_URI,
  SUI_DEVNET_FAUCET,
  SUI_PROVER_DEV_ENDPOINT,
  USER_SALT_LOCAL_STORAGE_KEY,
} from "./constant";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { suistakeLogo } from "./images";

interface ExtendedJwtPayload extends JwtPayload {
  email?: string;
}

export type PartialZkLoginSignature = Omit<
  Parameters<typeof getZkLoginSignature>["0"]["inputs"],
  "addressSeed"
>;

const suiClient = new SuiClient({ url: FULLNODE_URL });

const JWT_TOKEN_STORAGE_KEY = 'zklogin_jwt_token';
const WALLET_ADDRESS_STORAGE_KEY = 'zklogin_wallet_address';
const ZK_PROOF_STORAGE_KEY = 'zklogin_zk_proof';
const FAUCET_STATUS_STORAGE_KEY = 'zklogin_faucet_requested';


interface SnackbarState {
  visible: boolean;
  message: string;
  description?: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

const generateDeterministicSalt = (email: string): string => {
  // Create a deterministic salt based on email
  const encoder = new TextEncoder();
  const data = encoder.encode(email);
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
};

const StatsTab = ({ 
  currentEpoch, 
  addressBalance, 
  suiPrice 
}: { 
  currentEpoch: string, 
  addressBalance?: { totalBalance: string },
  suiPrice: number 
}) => {
  // Calculate balance in SUI
  const balanceInSui = addressBalance 
    ? Number(addressBalance.totalBalance) / Number(MIST_PER_SUI)
    : 0;

  // Format balance with 4 decimal places
  const formattedBalance = balanceInSui.toFixed(4);

  return (
    <div className="space-y-4">
      {/* Network Stats Card */}
      <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
        <div className="grid grid-cols-2 gap-6">
          {/* Total Value */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <FaCoins className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-sm text-white/60">Total Value</span>
            </div>
            <p className="text-2xl font-bold text-white">${(balanceInSui * suiPrice).toFixed(2)}</p>
            <span className="text-xs text-white/60">≈ {formattedBalance} SUI</span>
          </div>

          {/* Current Epoch */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
                <BiNetworkChart className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-sm text-white/60">Current Epoch</span>
            </div>
            <p className="text-2xl font-bold text-white">{currentEpoch || '...'}</p>
            <span className="text-xs text-white/60">Network Height</span>
          </div>
        </div>
      </div>

      {/* Gas Usage Card */}
      <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-500/10 flex items-center justify-center">
              <FaCoins className="w-4 h-4 text-orange-400" />
            </div>
            <span className="text-sm text-white/60">Gas Usage</span>
          </div>
          <span className="text-xs text-white/40">Last 30 days</span>
        </div>
        <p className="text-2xl font-bold text-white mb-2">0 SUI</p>
        <div className="w-full h-2 bg-white/5 rounded-full">
          <div className="w-0 h-full bg-orange-500 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

const CommunityTab = () => (
  <div className="space-y-4">
    {/* Community Updates */}
    <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
            <RiMessage3Line className="w-4 h-4 text-green-400" />
          </div>
          <span className="text-sm font-medium text-white">Social Media Tasks</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/60">Total Reward:</span>
          <span className="text-xs font-medium text-green-400">2.5 points</span>
        </div>
      </div>
      
      {/* Social Media Tasks List */}
      <div className="space-y-4">
        {/* X (Twitter) Task */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Follow on X</p>
              <p className="text-xs text-white/60">Reward: 1.0 points</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">Follow @SuiStakeit on X and retweet our pinned post</p>
          <a 
            href="https://x.com/SuiStakeit" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            Complete Task
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        Facebook Task
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#1877F2] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Follow on Facebook</p>
              <p className="text-xs text-white/60">Reward: 0.75 points</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">Like our Facebook page and share our latest post</p>
          <a 
            href="https://facebook.com/SuiStake" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            Complete Task
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>

        {/* Telegram Task */}
        <div className="bg-white/5 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#0088cc] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Join Telegram Community</p>
              <p className="text-xs text-white/60">Reward: 0.75 points</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">Join our Telegram group and stay active</p>
          <a 
            href="https://t.me/suistakeit" 
            target="_blank" 
            rel="noopener noreferrer" 
            
            className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            Complete Task
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>
    </div>
  </div>
);

const ActivityTab = () => (
  <div className="space-y-4">
    {/* Recent Activity */}
    <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
            <BiNetworkChart className="w-4 h-4 text-blue-400" />
          </div>
          <span className="text-sm font-medium text-white">Transaction History</span>
        </div>
        <Button
          size="small"
          className="bg-white/5 hover:bg-white/10 text-white rounded-full px-4 py-1 text-xs text-white"
        >
          Filter
        </Button>
      </div>
      
      {/* Empty State */}
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <BiNetworkChart className="w-8 h-8 text-white/20" />
        </div>
        <p className="text-white/60 mb-2">No transactions yet</p>
        <p className="text-sm text-white/40">Your transaction history will appear here</p>
      </div>

      {/* Transaction List (hidden initially) */}
      <div className="hidden space-y-3">
        {/* Sample Transaction */}
        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
              <FaCoins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Sent SUI</p>
              <p className="text-xs text-white/60">To: 0x1234...5678</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-white">-1.0 SUI</p>
            <p className="text-xs text-white/60">2 mins ago</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Add this interface for the API response
interface BlockberryResponse {
  data: {
    content: Array<{
      price: number;
      priceChange24h: number;
      // Add other fields as needed
    }>;
  };
}

function App() {
  const { i18n } = useTranslation();
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [currentEpoch, setCurrentEpoch] = useState("");
  const [nonce, setNonce] = useState("");
  const [oauthParams, setOauthParams] =
    useState<queryString.ParsedQuery<string>>();
  const [zkLoginUserAddress, setZkLoginUserAddress] = useState("");
  const [decodedJwt, setDecodedJwt] = useState<ExtendedJwtPayload>();
  const [jwtString, setJwtString] = useState("");
  const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
  const [userSalt, setUserSalt] = useState<string>();
  const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
  const [extendedEphemeralPublicKey, setExtendedEphemeralPublicKey] =
    useState("");
  const [maxEpoch, setMaxEpoch] = useState(0);
  const [randomness, setRandomness] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [, setFetchingZKProof] = useState(false);
  const [executingTxn, setExecutingTxn] = useState(false);
  const [, setExecuteDigest] = useState("");
  const [lang] = useState<"zh" | "en">("en");
  const [hasFaucetRequested, setHasFaucetRequested] = useState(false);
  const [, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [openReceiveModal, setOpenReceiveModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('stats');
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    visible: false,
    message: '',
    description: '',
    type: 'info'
  });
  const snackbarTimeoutRef = useRef<NodeJS.Timeout>();
  const [suiPrice, setSuiPrice] = useState<number>(0);
  const [priceChange24h, setPriceChange24h] = useState<number>(0);
  const initDataState = useSignal(initData.state);
  const user = initDataState?.user;

  const location = useLocation();
  const navigate = useNavigate();

  // Change lng
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [i18n, lang]);

  useEffect(() => {
    const res = queryString.parse(location.hash);
    setOauthParams(res);
  }, [location]);

  // query jwt id_token
  useEffect(() => {
    if (oauthParams && oauthParams.id_token) {
      const decodedJwt = jwtDecode(oauthParams.id_token as string);
      setJwtString(oauthParams.id_token as string);
      setDecodedJwt(decodedJwt);
      setActiveStep(2);
    }
  }, [oauthParams]);

  // Enhance initial setup effect
  useEffect(() => {
    const initializeWallet = async () => {
      try {
        setIsInitializing(true);
        
        // Restore JWT and decoded data
        const storedJwt = window.localStorage.getItem(JWT_TOKEN_STORAGE_KEY);
        if (storedJwt) {
          setJwtString(storedJwt);
          const decoded = jwtDecode(storedJwt) as ExtendedJwtPayload;
          setDecodedJwt(decoded);
          
          // Generate salt from email if available
          if (decoded.email && !userSalt) {
            const newSalt = generateDeterministicSalt(decoded.email);
            window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
            setUserSalt(newSalt);
          }
        }

        // Restore wallet address
        const storedAddress = window.localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
        if (storedAddress) {
          setZkLoginUserAddress(storedAddress);
        }

        // Restore ZK proof
        const storedZkProof = window.localStorage.getItem(ZK_PROOF_STORAGE_KEY);
        if (storedZkProof) {
          setZkProof(JSON.parse(storedZkProof));
        }

        // Restore faucet status
        const storedFaucetStatus = window.localStorage.getItem(FAUCET_STATUS_STORAGE_KEY);
        if (storedFaucetStatus) {
          setHasFaucetRequested(JSON.parse(storedFaucetStatus));
        }

        // Fetch and set current epoch
        const { epoch } = await suiClient.getLatestSuiSystemState();
        setCurrentEpoch(epoch);
        const newMaxEpoch = Number(epoch) + 10;
        window.localStorage.setItem(MAX_EPOCH_LOCAL_STORAGE_KEY, String(newMaxEpoch));
        setMaxEpoch(newMaxEpoch);

        // Setup keypair
        const privateKey = window.sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
        if (privateKey) {
          const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
          setEphemeralKeyPair(ephemeralKeyPair);
        } else {
          const newEphemeralKeyPair = Ed25519Keypair.generate();
          window.sessionStorage.setItem(
            KEY_PAIR_SESSION_STORAGE_KEY,
            newEphemeralKeyPair.export().privateKey
          );
          setEphemeralKeyPair(newEphemeralKeyPair);
        }

        // Setup randomness
        const storedRandomness = window.sessionStorage.getItem(RANDOMNESS_SESSION_STORAGE_KEY);
        if (storedRandomness) {
          setRandomness(storedRandomness);
        } else {
          const newRandomness = generateRandomness();
          window.sessionStorage.setItem(RANDOMNESS_SESSION_STORAGE_KEY, newRandomness);
          setRandomness(newRandomness);
        }

        // Restore user salt
        const storedUserSalt = window.localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
        if (storedUserSalt) {
          setUserSalt(storedUserSalt);
        }

      } catch (error) {
        console.error('Initialization error:', error);
        enqueueSnackbar('Failed to initialize wallet. Please try again.', { 
          variant: 'error',
          action: () => (
            <Button color="inherit" size="small" onClick={() => window.location.reload()}>
              Retry
            </Button>
          )
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeWallet();
  }, []);

  // Add effects to persist data when it changes
  useEffect(() => {
    if (jwtString) {
      window.localStorage.setItem(JWT_TOKEN_STORAGE_KEY, jwtString);
    }
  }, [jwtString]);

  useEffect(() => {
    if (zkLoginUserAddress) {
      window.localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, zkLoginUserAddress);
    }
  }, [zkLoginUserAddress]);

  useEffect(() => {
    if (zkProof) {
      window.localStorage.setItem(ZK_PROOF_STORAGE_KEY, JSON.stringify(zkProof));
    }
  }, [zkProof]);

  useEffect(() => {
    window.localStorage.setItem(FAUCET_STATUS_STORAGE_KEY, JSON.stringify(hasFaucetRequested));
  }, [hasFaucetRequested]);

  // Auto generate nonce when we have all required values
  useEffect(() => {
    if (ephemeralKeyPair && maxEpoch && randomness && !nonce) {
      const newNonce = generateNonce(
        ephemeralKeyPair.getPublicKey(),
        maxEpoch,
        randomness
      );
      setNonce(newNonce);
    }
  }, [ephemeralKeyPair, maxEpoch, randomness, nonce]);

  // const nextButtonDisabled = useMemo(() => {
  //   switch (activeStep) {
  //     case 0:
  //       return !ephemeralKeyPair;
  //     case 1:
  //       return !currentEpoch || !randomness;
  //     case 2:
  //       return !jwtString;
  //     case 3:
  //       return !userSalt;
  //     case 4:
  //       return !zkLoginUserAddress;
  //     case 5:
  //       return !zkProof;
  //     case 6:
  //       return true;
  //     default:
  //       return true;
  //   }
  // }, [
  //   currentEpoch,
  //   randomness,
  //   activeStep,
  //   jwtString,
  //   ephemeralKeyPair,
  //   zkLoginUserAddress,
  //   zkProof,
  //   userSalt,
  // ]);

  // query zkLogin address balance
  const { data: addressBalance } = useSuiClientQuery(
    "getBalance",
    {
      owner: zkLoginUserAddress,
    },
    {
      enabled: Boolean(zkLoginUserAddress),
      refetchInterval: 1500,
    }
  );

  const resetState = () => {
    // Clear all stored data
    window.localStorage.removeItem(JWT_TOKEN_STORAGE_KEY);
    window.localStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
    window.localStorage.removeItem(ZK_PROOF_STORAGE_KEY);
    window.localStorage.removeItem(FAUCET_STATUS_STORAGE_KEY);
    window.localStorage.removeItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
    window.localStorage.removeItem(USER_SALT_LOCAL_STORAGE_KEY);
    window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
    window.sessionStorage.removeItem(RANDOMNESS_SESSION_STORAGE_KEY);

    // Reset all state
    setCurrentEpoch("");
    setNonce("");
    setOauthParams(undefined);
    setZkLoginUserAddress("");
    setDecodedJwt(undefined);
    setJwtString("");
    setEphemeralKeyPair(undefined);
    setUserSalt(undefined);
    setZkProof(undefined);
    setExtendedEphemeralPublicKey("");
    setMaxEpoch(0);
    setRandomness("");
    setActiveStep(0);
    setFetchingZKProof(false);
    setExecutingTxn(false);
    setExecuteDigest("");
    setHasFaucetRequested(false);
  };

  const resetLocalState = () => {
    try {
      window.sessionStorage.clear();
      window.localStorage.clear();
      resetState();
      setShowResetDialog(false);
      navigate(`/`);
      setActiveStep(0);
      enqueueSnackbar("Reset successful", {
        variant: "success",
      });
    } catch (error) {
      enqueueSnackbar(String(error), {
        variant: "error",
      });
    }
  };

  const [requestingFaucet, setRequestingFaucet] = useState(false);

  // const requestFaucet = async () => {
  //   if (!zkLoginUserAddress || hasFaucetRequested) {
  //     return;
  //   }
  //   try {
  //     setRequestingFaucet(true);
  //     await axios.post(SUI_DEVNET_FAUCET, {
  //       FixedAmountRequest: {
  //         recipient: zkLoginUserAddress,
  //       },
  //     });
  //     setHasFaucetRequested(true);
  //     enqueueSnackbar("Successfully received test tokens!", {
  //       variant: "success",
  //     });
  //   } catch (error) {
  //     console.error(error);
  //     const err = error as { response?: { data?: { message?: string } } };
  //     enqueueSnackbar(String(err?.response?.data?.message || error), {
  //       variant: "error",
  //     });
  //   } finally {
  //     setRequestingFaucet(false);
  //   }
  // };

  // Auto generate user salt and address when JWT is available
  useEffect(() => {
    if (decodedJwt?.email && !userSalt) {
      // Generate deterministic salt based on email
      const newSalt = generateDeterministicSalt(decodedJwt.email);
      window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
      setUserSalt(newSalt);
    }

    if (jwtString && userSalt && !zkLoginUserAddress) {
      // Generate zkLogin address
      const newAddress = jwtToAddress(jwtString, userSalt);
      setZkLoginUserAddress(newAddress);
    }
  }, [decodedJwt, jwtString, userSalt, zkLoginUserAddress]);

  // Auto generate extended ephemeral public key and fetch ZK proof
  useEffect(() => {
    const generateMissingData = async () => {
      if (!ephemeralKeyPair || !zkLoginUserAddress || !maxEpoch || !randomness || !userSalt || !oauthParams?.id_token) {
        return;
      }

      try {
        // Generate extended ephemeral public key if not already set
        if (!extendedEphemeralPublicKey) {
          const newExtendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
            ephemeralKeyPair.getPublicKey()
          );
          setExtendedEphemeralPublicKey(newExtendedEphemeralPublicKey);
        }

        // Fetch ZK proof if not already present
        if (!zkProof) {
          setFetchingZKProof(true);
          const zkProofResult = await axios.post(
            SUI_PROVER_DEV_ENDPOINT,
            {
              jwt: oauthParams.id_token,
              extendedEphemeralPublicKey: extendedEphemeralPublicKey || getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey()),
              maxEpoch: maxEpoch,
              jwtRandomness: randomness,
              salt: userSalt,
              keyClaimName: "sub",
            },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          setZkProof(zkProofResult.data as PartialZkLoginSignature);
          enqueueSnackbar("Successfully obtained ZK Proof", {
            variant: "success",
          });
        }
      } catch (err) {
        console.error(err);
        const error = err as { response?: { data?: { message?: string } } };
        enqueueSnackbar(String(error?.response?.data?.message || err), {
          variant: "error",
        });
      } finally {
        setFetchingZKProof(false);
      }
    };

    generateMissingData();
  }, [ephemeralKeyPair, zkLoginUserAddress, maxEpoch, randomness, userSalt, oauthParams?.id_token, extendedEphemeralPublicKey, zkProof]);

  // Auto advance steps when data is available
  useEffect(() => {
    if (activeStep === 2 && jwtString) {
      setActiveStep(3);
    }
    if (activeStep === 3 && userSalt) {
      setActiveStep(4);
    }
    if (activeStep === 4 && zkLoginUserAddress) {
      setActiveStep(5);
    }
    if (activeStep === 5 && zkProof) {
      setActiveStep(6);
    }
  }, [activeStep, jwtString, userSalt, zkLoginUserAddress, zkProof]);

  // Auto request faucet when address is generated
  useEffect(() => {
    const autoRequestFaucet = async () => {
      if (!zkLoginUserAddress || requestingFaucet || hasFaucetRequested) {
        return;
      }
      try {
        setRequestingFaucet(true);
        await axios.post(SUI_DEVNET_FAUCET, {
          FixedAmountRequest: {
            recipient: zkLoginUserAddress,
          },
        });
        setHasFaucetRequested(true);
        enqueueSnackbar("Successfully received test tokens!", {
          variant: "success",
        });
      } catch (error) {
        console.error(error);
        const err = error as { response?: { data?: { message?: string } } };
        enqueueSnackbar(String(err?.response?.data?.message || error), {
          variant: "error",
        });
      } finally {
        setRequestingFaucet(false);
      }
    };

    autoRequestFaucet();
  }, [zkLoginUserAddress]);

  // Add session expiry check
  useEffect(() => {
    const checkSession = () => {
      if (jwtString) {
        try {
          const decodedToken = jwtDecode(jwtString);
          const expirationTime = (decodedToken.exp || 0) * 1000; // Convert to milliseconds
          
          if (Date.now() >= expirationTime) {
            enqueueSnackbar('Session expired. Please sign in again.', { 
              variant: 'warning',
              autoHideDuration: 5000
            });
            resetState();
          }
        } catch (error) {
          console.error('Error checking session:', error);
        }
      }
    };

    // Check immediately and then every minute
    checkSession();
    const interval = setInterval(checkSession, 60000);

    return () => clearInterval(interval);
  }, [jwtString]);

  // Add this near your other useEffect hooks
  useEffect(() => {
    // Function to refresh the session
    const refreshSession = async () => {
      try {
        if (!jwtString || !maxEpoch) return;
        
        // Get current epoch
        const { epoch } = await suiClient.getLatestSuiSystemState();
        const currentEpoch = Number(epoch);
        
        // If we're approaching max epoch (e.g., within 5 epochs), refresh
        if (maxEpoch - currentEpoch <= 5) {
          // Re-fetch JWT token
          const loginUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=id_token&redirect_uri=${REDIRECT_URI}&scope=openid%20email&nonce=${nonce}`;
          window.location.href = loginUrl;
        }
      } catch (error) {
        console.error('Failed to refresh session:', error);
      }
    };

    // Check every 5 minutes
    const interval = setInterval(refreshSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [jwtString, maxEpoch, nonce]);

  const handleTransaction = async () => {
    try {
      if (!ephemeralKeyPair || !zkProof || !decodedJwt || !userSalt) {
        enqueueSnackbar('Missing required wallet data', { variant: 'error' });
        return;
      }

      setExecutingTxn(true);
      const txb = new TransactionBlock();

      // Create a test transaction (sending 1 SUI)
      const [coin] = txb.splitCoins(txb.gas, [1000000000]); // 1 SUI = 1000000000 MIST
      txb.transferObjects(
        [coin],
        "0xfa0f8542f256e669694624aa3ee7bfbde5af54641646a3a05924cf9e329a8a36" // Example recipient
      );
      txb.setSender(zkLoginUserAddress);

      // Sign the transaction with ephemeral key pair
      const { bytes, signature: userSignature } = await txb.sign({
        client: suiClient,
        signer: ephemeralKeyPair,
      });

      if (!decodedJwt.sub || !decodedJwt.aud) {
        throw new Error('Invalid JWT data');
      }

      // Generate address seed
      const addressSeed = genAddressSeed(
        BigInt(userSalt),
        'sub',
        decodedJwt.sub,
        decodedJwt.aud as string
      ).toString();

      console.log('Address Seed:', addressSeed);
      console.log('ZK Proof:', zkProof);

      // Create zkLogin signature
      const zkLoginSignature: SerializedSignature = getZkLoginSignature({
        inputs: {
          ...zkProof,
          addressSeed,
        },
        maxEpoch,
        userSignature,
      });

      console.log('ZK Login Signature:', zkLoginSignature);

      // Execute the transaction
      const executeRes = await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature: zkLoginSignature,
      });

      enqueueSnackbar('Transaction successful!', { variant: 'success' });
      setExecuteDigest(executeRes.digest);

    } catch (error) {
      console.error('Transaction error:', error);
      enqueueSnackbar(
        error instanceof Error ? error.message : 'Transaction failed', 
        { variant: 'error' }
      );
    } finally {
      setExecutingTxn(false);
    }
  };

  // Add email verification to Google sign-in
  const handleGoogleSignIn = () => {
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: REDIRECT_URI,
      response_type: "id_token",
      scope: "openid email", // Add email to scope
      nonce: nonce,
    });
    window.location.replace(
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`
    );
  };

  // // Create a ComingSoon component
  // const ComingSoonTab = ({ title }: { title: string }) => (
  //   <div className="flex-1 flex flex-col items-center justify-center p-4">
  //     <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-8 shadow-xl text-center max-w-md w-full">
  //       <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
  //         <FaCoins className="w-8 h-8 text-blue-400" />
  //       </div>
  //       <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
  //       <p className="text-white/60">
  //         This feature is coming soon. Stay tuned for updates!
  //       </p>
  //     </div>
  //   </div>
  // );

  const handleOpenReceiveModal = () => {
    setOpenReceiveModal(true);
  };

  const handleCloseReceiveModal = () => {
    setOpenReceiveModal(false);
    setCopied(false);
  };

  const handleCopyAddress = () => {
    if (zkLoginUserAddress) {
      navigator.clipboard.writeText(zkLoginUserAddress);
      setCopied(true);
    }
  };

  useEffect(() => {
    const fetchSuiPrice = async () => {
      const options = {
        method: 'GET',
        url: 'https://cors.blockberry.one/sui/v1/coins', // Using CORS-enabled endpoint
        params: {
          page: '0',
          size: '20',
          orderBy: 'DESC',
          sortBy: 'AGE',
          withImage: 'TRUE'
        },
        headers: {
          accept: '*/*',
          'x-api-key': 'V4O9xRP59Iv1Shv6SXI3lD55HHYdHN'
        },
        // Add timeout and retry configuration
        timeout: 5000,
        retries: 3
      };

      try {
        const response = await axios.request<BlockberryResponse>(options);
        
        if (response.data && response.data.data && response.data.data.content && response.data.data.content.length > 0) {
          const suiData = response.data.data.content[0];
          setSuiPrice(suiData.price);
          setPriceChange24h(suiData.priceChange24h);
        } else {
          // Fallback to a different API if Blockberry fails
          const fallbackResponse = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true'
          );
          setSuiPrice(fallbackResponse.data.sui.usd);
          setPriceChange24h(fallbackResponse.data.sui.usd_24h_change);
        }
      } catch (error) {
        console.error('Error fetching SUI price:', error);
        
        // Attempt fallback to CoinGecko if Blockberry fails
        try {
          const fallbackResponse = await axios.get(
            'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd&include_24hr_change=true'
          );
          setSuiPrice(fallbackResponse.data.sui.usd);
          setPriceChange24h(fallbackResponse.data.sui.usd_24h_change);
        } catch (fallbackError) {
          console.error('Fallback API also failed:', fallbackError);
          enqueueSnackbar('Unable to fetch price data', { 
            variant: 'error',
            action: () => (
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            )
          });
        }
      }
    };

    fetchSuiPrice();
    
    // Add error handling for the interval
    let intervalId: NodeJS.Timeout;
    try {
      intervalId = setInterval(fetchSuiPrice, 60000);
    } catch (error) {
      console.error('Error setting up price refresh interval:', error);
    }

    // Cleanup
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  if (!zkLoginUserAddress) {
    return (
      <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white antialiased">
        {/* Header - Enhanced user profile section */}
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center sticky top-0 bg-black/80 backdrop-blur-lg z-50 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066FF] via-purple-600 to-pink-500 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient"></div>
              <div className="relative">
                <img 
                  src={user?.photoUrl || "https://xelene.me/telegram.gif"} 
                  alt="" 
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-black"
                />
                {user?.isPremium && (
                  <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full ring-2 ring-black">
                    <span className="text-xs">⭐️</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">
                  @{user?.username || 'Anonymous'}
                </span>
                {user?.isPremium && (
                  <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-gradient-to-r from-yellow-400/10 to-yellow-600/10 text-yellow-500 rounded-full ring-1 ring-yellow-500/20">
                    Premium
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-400">
                {user?.firstName || 'Anonymous'}
              </span>
            </div>
          </div>
          
          {/* Add this button */}
           <Button 
            className="relative overflow-hidden bg-gradient-to-r from-[#0066FF] to-blue-700 hover:from-[#0052cc] hover:to-blue-800 text-white rounded-[20px] px-8 py-5 font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-blue-500/20 border border-white/10 hover:scale-105"
          >
            <div className="absolute inset-0 bg-grid-white/10 bg-[size:6px_6px] motion-safe:animate-grid-white"></div>
            <span className="relative z-10 text-sm font-semibold text-white">Invite</span>
            <span className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10"></span>
          </Button>
        </div>

        {/* Auth Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8 text-center">
            <div className="space-y-3">
              <img src={suistakeLogo} alt="SUI Stake Logo" className="w-25 h-25 mx-auto mb-4" />
              <h1 className="text-3xl font-bold tracking-tight text-white">
                Welcome to SUI Stake
              </h1>
              <p className="text-white/60">
                Connect with Google to access your wallet and start transacting on the SUI network.
              </p>
            </div>

            <div className="space-y-4">
              <button 
                onClick={handleGoogleSignIn}
                disabled={!nonce}
                className="w-full bg-gradient-to-r from-[#0066FF] via-blue-500 to-blue-600 hover:from-[#0052cc] hover:via-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!nonce ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Initializing...
                  </div>
                ) : (
                  <>
                    <img src={GoogleLogo} alt="Google" className="w-5 h-5" />
                    Continue with Google
                  </>
                )}
              </button>

              <div className="text-sm text-white/40">
                By continuing, you agree to our Terms of Service
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white antialiased">
        {/* Header */}
        <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-xl z-50 border-b border-white/5">
        {/* Left side: User Info and Actions */}
        <div className="flex items-center gap-3">
          {/* User Avatar and Address */}
          <div className="relative group">
            <img src={"https://xelene.me/telegram.gif"} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-black/50" />
          </div>
          <div className="flex flex-col">
            {zkLoginUserAddress && (
              <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors group">
                <span className="text-xs font-medium text-white/60">
                  {zkLoginUserAddress.slice(0, 6)}...{zkLoginUserAddress.slice(-4)}
                </span>
                <button onClick={handleCopyAddress} className="text-blue-300 hover:text-blue-300 transition-colors ml-1" title="Copy address">
                  {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: SUI Price */}
        <div className="flex items-center gap-2 bg-white/5 rounded-full px-4 py-2">
          <FaCoins className="w-4 h-4 text-blue-400" />
          <div className="flex flex-col items-start">
            <div className="flex items-center gap-1">
              {suiPrice ? (
                <>
                  <span className="text-sm font-medium text-white">${suiPrice.toFixed(2)}</span>
                  {typeof priceChange24h === 'number' && (
                    <span className={`text-xs ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {priceChange24h >= 0 ? '↑' : '↓'}{Math.abs(priceChange24h).toFixed(2)}%
                    </span>
                  )}
                </>
              ) : (
                <span className="text-sm text-white/60">Loading...</span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Reset and Logout */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { resetLocalState(); enqueueSnackbar('Successfully logged out', { variant: 'success' }); }} 
            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full p-2 transition-all duration-200" 
            title="Logout"
          >
            <FiLogOut size={20} />
          </button>
        </div>
      </div>


      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-4 pb-20 space-y-5">
        {activeTab === 'home' && (
          <>
            {/* Balance Card */}
            <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5">
              {/* Balance and Network Info */}
              <div className="flex items-center justify-between mb-6">
                {/* Balance Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <FaCoins className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-white/60">Wallet Balance</span>
                    <div className="flex flex-col">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                          {addressBalance ? BigNumber(addressBalance?.totalBalance).div(MIST_PER_SUI.toString()).toFixed(4) : '0.0000'}
                        </span>
                        <span className="text-sm font-medium text-white/60">SUI</span>
                      </div>
                      {suiPrice > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-white/60">
                            ${(suiPrice * (addressBalance ? BigNumber(addressBalance?.totalBalance).div(MIST_PER_SUI.toString()).toNumber() : 0)).toFixed(2)}
                          </span>
                          <span className={`text-xs ${priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {priceChange24h >= 0 ? '↑' : '↓'} {Math.abs(priceChange24h).toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {/* Network Info */}
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-white/40">Network</span>
                  <span className="text-sm font-medium text-white/80">Devnet</span>
                </div>
              </div>
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button onClick={handleTransaction} disabled={executingTxn || !zkLoginUserAddress} className="bg-gradient-to-r from-[#0066FF] via-blue-500 to-blue-600 hover:from-[#0052cc] hover:via-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                  {executingTxn ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Sending...</span>
                    </>
                  ) : (
                    'Send SUI'
                  )}
                </button>
                <button onClick={handleOpenReceiveModal} className="bg-white/5 hover:bg-white/10 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2">
                  <RiMessage3Line className="w-4 h-4" />
                  Receive
                </button>
              </div>
            </div>

             {/* Earnings Card */}
             <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-200">Earnings Available</span>
                <button
                  className="bg-white text-black rounded-full px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
                >
                  Withdraw
                </button>
              </div>
              <div className="flex flex-col">
                <span className="text-[48px] font-extrabold text-white tracking-tight">$0</span>
                <span className="text-[18px] font-medium text-white/60 mt-2">0 SUI</span>
              </div>
              
              <div className="mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Staking timeline</span>
                  <AiOutlineInfoCircle className="text-gray-400" />
                </div>
                <div className="w-full h-1 bg-[#2a2a40] rounded-full mt-2">
                  <div className="w-1/3 h-full bg-blue-500 rounded-full" />
                </div>
              </div>
            </div>

            {/* Stats Navigation with Active Indicator */}
            <div className="mb-6">
              <div className="bg-[#1A1B1E]/60 backdrop-blur-xl rounded-[20px] p-2 border border-white/5">
                <div className="flex gap-2 relative">
                  {/* Active Tab Indicator */}
                  <div
                    className="absolute h-full transition-all duration-300 ease-out"
                    style={{
                      left: `${(activeSection === 'stats' ? 0 : activeSection === 'community' ? 33.33 : 66.66)}%`,
                      width: '33.33%',
                    }}
                  >
                    <div className="h-full w-full rounded-full bg-[#0066FF] opacity-10" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-[#0066FF] rounded-full" />
                  </div>

                  {/* Tabs */}
                  <Button
                    size="small"
                    className={`rounded-full px-6 py-2.5 flex-1 transition-all duration-300 relative z-10 ${
                      activeSection === 'stats' 
                        ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:scale-[1.02]'
                    }`}
                    onClick={() => setActiveSection('stats')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <BiNetworkChart className={`w-4 h-4 ${activeSection === 'stats' ? 'text-white' : 'text-gray-400'}`} />
                      <span className="font-medium text-white">Stats</span>
                    </div>
                  </Button>

                  <Button
                    size="small"
                    className={`rounded-full px-6 py-2.5 flex-1 transition-all duration-300 relative z-10 ${
                      activeSection === 'community' 
                        ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:scale-[1.02]'
                    }`}
                    onClick={() => setActiveSection('community')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <RiMessage3Line className={`w-4 h-4 ${activeSection === 'community' ? 'text-white' : 'text-gray-400'}`} />
                      <span className="font-medium text-white">Community</span>
                    </div>
                  </Button>

                  <Button
                    size="small"
                    className={`rounded-full px-6 py-2.5 flex-1 transition-all duration-300 relative z-10 ${
                      activeSection === 'activity' 
                        ? 'bg-[#0066FF] text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:scale-[1.02]'
                    }`}
                    onClick={() => setActiveSection('activity')}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaCoins className={`w-4 h-4 ${activeSection === 'activity' ? 'text-white' : 'text-gray-400'}`} />
                      <span className="font-medium text-white">Activity</span>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Optional: Add subtle glow effect under active tab */}
              <div 
                className="h-1 mt-1 blur-xl transition-all duration-300 bg-[#0066FF]/20 rounded-full"
                style={{
                  width: '33.33%',
                  marginLeft: `${(activeSection === 'stats' ? 0 : activeSection === 'community' ? 33.33 : 66.66)}%`,
                }}
              />
            </div>

            {/* Section Content */}
            <div className="">
              {activeSection === 'stats' && <StatsTab currentEpoch={currentEpoch} addressBalance={addressBalance} suiPrice={suiPrice} />}
              {activeSection === 'community' && <CommunityTab />}
              {activeSection === 'activity' && <ActivityTab />}
            </div>

            {/* Receive Modal */}
            <Dialog open={openReceiveModal} onClose={handleCloseReceiveModal} PaperProps={{
              style: {
                background: 'linear-gradient(135deg, #1A1B1E, #252730)', // Professional gradient background
                borderRadius: '16px',
                padding: '20px',
                color: 'white',
              }
            }}>
              <DialogTitle style={{ textAlign: 'center', fontWeight: 'bold', color: '#00BFFF' }}>Receive SUI</DialogTitle>
              <DialogContent>
                <div className="flex flex-col space-y-4">
                  {zkLoginUserAddress && (
                    <>
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex justify-center">
                        <QRCodeSVG value={zkLoginUserAddress} size={200} level="H" className="p-2 bg-white rounded-xl" />
                      </div>
                      <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
                        <span className="text-sm text-white/60 block mb-2">Wallet Address</span>
                        <div className="flex items-center gap-2 break-all">
                          <span className="text-sm font-medium text-white/90">{zkLoginUserAddress}</span>
                          <button onClick={handleCopyAddress} className="text-blue-400 hover:text-blue-300 transition-colors">
                            {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                          </button>
                        </div>
                        {copied && <span className="text-xs text-green-400">Copied to clipboard!</span>}
                      </div>
                      <div className="flex items-center gap-2 bg-blue-500/5 rounded-xl p-3">
                        <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-blue-400">Only send SUI to this address</span>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseReceiveModal} style={{ color: '#0066FF' }}>
                  Close
                </Button>
              </DialogActions>
            </Dialog>
          </>
        )}
        {/* {activeTab === 'network' && <NetworkTab />}
        {activeTab === 'gmp' && <GMPTab />}
        {activeTab === 'support' && <SupportTab />}
        {activeTab === 'token' && <TokenTab />} */}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1B1E]/90 backdrop-blur-xl border-t border-white/5 safe-area-pb z-50">
        <div className="max-w-lg mx-auto px-2 md:px-4">
          <div className="grid grid-cols-5 items-center">
            {[
              { id: 'home', text: 'Home', Icon: AiOutlineHome },
              { id: 'network', text: 'Network', Icon: BiNetworkChart },
              { id: 'gmp', text: 'GMP', Icon: FaCoins },
              { id: 'support', text: 'Support', Icon: RiMessage3Line },
              { id: 'token', text: 'Token', Icon: FaCoins }
            ].map(({ id, text, Icon }) => (
              <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center py-3 md:py-4 w-full transition-all duration-300 relative group ${activeTab === id ? 'text-blue-400' : 'text-white/40 hover:text-white/60'}`}>
                <Icon size={18} className={`${activeTab === id ? 'transform scale-110 transition-transform duration-300' : 'group-hover:scale-110 transition-transform duration-300'}`} />
                <span className="text-[10px] md:text-xs font-medium mt-1 tracking-wide truncate max-w-[64px] text-center">{text}</span>
                {activeTab === id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-blue-400" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Dialog */}
      <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)} className="fixed z-50 inset-0 overflow-y-auto">
        <div className="bg-[#1A1B1E] p-6 rounded-2xl max-w-sm mx-auto">
          <h3 className="text-lg font-medium text-white mb-2">Reset Wallet?</h3>
          <p className="text-white/60 text-sm mb-4">This will clear all wallet data. Make sure you have backed up any important information.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowResetDialog(false)} className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white">Cancel</button>
            <button onClick={() => { resetState(); setShowResetDialog(false); enqueueSnackbar('Wallet reset successful', { variant: 'success' }); }} className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">Reset</button>
          </div>
        </div>
      </Dialog>

      {snackbar.visible && (
        <div className={`fixed top-0 left-0 right-0 z-[9999] transform transition-all duration-300 ${
          snackbar.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
        }`}>
          <div className="max-w-md mx-auto m-4">
            <div className="bg-[#1A1B1E] border border-white/10 rounded-lg shadow-lg p-4 flex items-start gap-3">
              {/* Icon based on type */}
              <div className={`flex-shrink-0 w-5 h-5 ${
                snackbar.type === 'success' ? 'text-green-400' :
                snackbar.type === 'error' ? 'text-red-400' :
                snackbar.type === 'warning' ? 'text-yellow-400' :
                'text-blue-400'
              }`}>
                {snackbar.type === 'success' && <CheckCircleIcon className="w-5 h-5" />}
                {snackbar.type === 'error' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {snackbar.type === 'warning' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                {snackbar.type === 'info' && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              </div>
              
              {/* Content */}
              <div className="flex-1">
                <p className="text-white font-medium">{snackbar.message}</p>
                {snackbar.description && (
                  <p className="text-white/60 text-sm mt-1">{snackbar.description}</p>
                )}
              </div>
              
              {/* Close button */}
              <button
                onClick={() => {
                  setSnackbar(prev => ({ ...prev, visible: false }));
                  if (snackbarTimeoutRef.current) {
                    clearTimeout(snackbarTimeoutRef.current);
                  }
                }}
                className="flex-shrink-0 text-white/40 hover:text-white/60 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
