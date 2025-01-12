// import { LoadingButton } from "@mui/lab";
// import {
//   Alert,
//   Box,
//   Button,
//   ButtonGroup,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
//   Stack,
//   Typography,
//   Paper,
//   CircularProgress,
//   Link,
//   IconButton,
//   Skeleton,
// } from "@mui/material";
// import { fromB64 } from "@mysten/bcs";
// import { useSuiClientQuery } from "@mysten/dapp-kit";
// import { SuiClient } from "@mysten/sui.js/client";
// import { SerializedSignature } from "@mysten/sui.js/cryptography";
// import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
// import { TransactionBlock } from "@mysten/sui.js/transactions";
// import { MIST_PER_SUI } from "@mysten/sui.js/utils";
// import {
//   genAddressSeed,
//   generateNonce,
//   generateRandomness,
//   getExtendedEphemeralPublicKey,
//   getZkLoginSignature,
//   jwtToAddress,
// } from "@mysten/zklogin";
// import axios from "axios";
// import { BigNumber } from "bignumber.js";
// import { JwtPayload, jwtDecode } from "jwt-decode";
// import { enqueueSnackbar } from "notistack";
// import queryString from "query-string";
// import { useEffect, useMemo, useState } from "react";
// import { Trans, useTranslation } from "react-i18next";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./App.css";
// import GoogleLogo from "./assets/google.svg";

// import {
//   CLIENT_ID,
//   FULLNODE_URL,
//   KEY_PAIR_SESSION_STORAGE_KEY,
//   MAX_EPOCH_LOCAL_STORAGE_KEY,
//   RANDOMNESS_SESSION_STORAGE_KEY,
//   REDIRECT_URI,
//   SUI_DEVNET_FAUCET,
//   SUI_PROVER_DEV_ENDPOINT,
//   USER_SALT_LOCAL_STORAGE_KEY,
// } from "./constant";
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// interface ExtendedJwtPayload extends JwtPayload {
//   email?: string;
// }

// export type PartialZkLoginSignature = Omit<
//   Parameters<typeof getZkLoginSignature>["0"]["inputs"],
//   "addressSeed"
// >;

// const suiClient = new SuiClient({ url: FULLNODE_URL });

// const JWT_TOKEN_STORAGE_KEY = 'zklogin_jwt_token';
// const WALLET_ADDRESS_STORAGE_KEY = 'zklogin_wallet_address';
// const ZK_PROOF_STORAGE_KEY = 'zklogin_zk_proof';
// const FAUCET_STATUS_STORAGE_KEY = 'zklogin_faucet_requested';

// const generateDeterministicSalt = (email: string): string => {
//   // Create a deterministic salt based on email
//   const encoder = new TextEncoder();
//   const data = encoder.encode(email);
//   let hash = 0;
//   for (let i = 0; i < data.length; i++) {
//     hash = ((hash << 5) - hash) + data[i];
//     hash = hash & hash; // Convert to 32-bit integer
//   }
//   return Math.abs(hash).toString();
// };

// function App() {
//   const { t, i18n } = useTranslation();
//   const [showResetDialog, setShowResetDialog] = useState(false);
//   const [currentEpoch, setCurrentEpoch] = useState("");
//   const [nonce, setNonce] = useState("");
//   const [oauthParams, setOauthParams] =
//     useState<queryString.ParsedQuery<string>>();
//   const [zkLoginUserAddress, setZkLoginUserAddress] = useState("");
//   const [decodedJwt, setDecodedJwt] = useState<ExtendedJwtPayload>();
//   const [jwtString, setJwtString] = useState("");
//   const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
//   const [userSalt, setUserSalt] = useState<string>();
//   const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
//   const [extendedEphemeralPublicKey, setExtendedEphemeralPublicKey] =
//     useState("");
//   const [maxEpoch, setMaxEpoch] = useState(0);
//   const [randomness, setRandomness] = useState("");
//   const [activeStep, setActiveStep] = useState(0);
//   const [fetchingZKProof, setFetchingZKProof] = useState(false);
//   const [executingTxn, setExecutingTxn] = useState(false);
//   const [executeDigest, setExecuteDigest] = useState("");
//   const [lang, setLang] = useState<"zh" | "en">("en");
//   const [hasFaucetRequested, setHasFaucetRequested] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);

//   const location = useLocation();
//   const navigate = useNavigate();

//   // Change lng
//   useEffect(() => {
//     i18n.changeLanguage(lang);
//   }, [i18n, lang]);

//   useEffect(() => {
//     const res = queryString.parse(location.hash);
//     setOauthParams(res);
//   }, [location]);

//   // query jwt id_token
//   useEffect(() => {
//     if (oauthParams && oauthParams.id_token) {
//       const decodedJwt = jwtDecode(oauthParams.id_token as string);
//       setJwtString(oauthParams.id_token as string);
//       setDecodedJwt(decodedJwt);
//       setActiveStep(2);
//     }
//   }, [oauthParams]);

//   // Enhance initial setup effect
//   useEffect(() => {
//     const initializeWallet = async () => {
//       try {
//         setIsInitializing(true);
        
//         // Restore JWT and decoded data
//         const storedJwt = window.localStorage.getItem(JWT_TOKEN_STORAGE_KEY);
//         if (storedJwt) {
//           setJwtString(storedJwt);
//           const decoded = jwtDecode(storedJwt) as ExtendedJwtPayload;
//           setDecodedJwt(decoded);
          
//           // Generate salt from email if available
//           if (decoded.email && !userSalt) {
//             const newSalt = generateDeterministicSalt(decoded.email);
//             window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
//             setUserSalt(newSalt);
//           }
//         }

//         // Restore wallet address
//         const storedAddress = window.localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
//         if (storedAddress) {
//           setZkLoginUserAddress(storedAddress);
//         }

//         // Restore ZK proof
//         const storedZkProof = window.localStorage.getItem(ZK_PROOF_STORAGE_KEY);
//         if (storedZkProof) {
//           setZkProof(JSON.parse(storedZkProof));
//         }

//         // Restore faucet status
//         const storedFaucetStatus = window.localStorage.getItem(FAUCET_STATUS_STORAGE_KEY);
//         if (storedFaucetStatus) {
//           setHasFaucetRequested(JSON.parse(storedFaucetStatus));
//         }

//         // Fetch and set current epoch
//         const { epoch } = await suiClient.getLatestSuiSystemState();
//         setCurrentEpoch(epoch);
//         const newMaxEpoch = Number(epoch) + 10;
//         window.localStorage.setItem(MAX_EPOCH_LOCAL_STORAGE_KEY, String(newMaxEpoch));
//         setMaxEpoch(newMaxEpoch);

//         // Setup keypair
//         const privateKey = window.sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
//         if (privateKey) {
//           const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
//           setEphemeralKeyPair(ephemeralKeyPair);
//         } else {
//           const newEphemeralKeyPair = Ed25519Keypair.generate();
//           window.sessionStorage.setItem(
//             KEY_PAIR_SESSION_STORAGE_KEY,
//             newEphemeralKeyPair.export().privateKey
//           );
//           setEphemeralKeyPair(newEphemeralKeyPair);
//         }

//         // Setup randomness
//         const storedRandomness = window.sessionStorage.getItem(RANDOMNESS_SESSION_STORAGE_KEY);
//         if (storedRandomness) {
//           setRandomness(storedRandomness);
//         } else {
//           const newRandomness = generateRandomness();
//           window.sessionStorage.setItem(RANDOMNESS_SESSION_STORAGE_KEY, newRandomness);
//           setRandomness(newRandomness);
//         }

//         // Restore user salt
//         const storedUserSalt = window.localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
//         if (storedUserSalt) {
//           setUserSalt(storedUserSalt);
//         }

//       } catch (error) {
//         console.error('Initialization error:', error);
//         enqueueSnackbar('Failed to initialize wallet. Please try again.', { 
//           variant: 'error',
//           action: (key) => (
//             <Button color="inherit" size="small" onClick={() => window.location.reload()}>
//               Retry
//             </Button>
//           )
//         });
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initializeWallet();
//   }, []);

//   // Add effects to persist data when it changes
//   useEffect(() => {
//     if (jwtString) {
//       window.localStorage.setItem(JWT_TOKEN_STORAGE_KEY, jwtString);
//     }
//   }, [jwtString]);

//   useEffect(() => {
//     if (zkLoginUserAddress) {
//       window.localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, zkLoginUserAddress);
//     }
//   }, [zkLoginUserAddress]);

//   useEffect(() => {
//     if (zkProof) {
//       window.localStorage.setItem(ZK_PROOF_STORAGE_KEY, JSON.stringify(zkProof));
//     }
//   }, [zkProof]);

//   useEffect(() => {
//     window.localStorage.setItem(FAUCET_STATUS_STORAGE_KEY, JSON.stringify(hasFaucetRequested));
//   }, [hasFaucetRequested]);

//   // Auto generate nonce when we have all required values
//   useEffect(() => {
//     if (ephemeralKeyPair && maxEpoch && randomness && !nonce) {
//       const newNonce = generateNonce(
//         ephemeralKeyPair.getPublicKey(),
//         maxEpoch,
//         randomness
//       );
//       setNonce(newNonce);
//     }
//   }, [ephemeralKeyPair, maxEpoch, randomness, nonce]);

//   const nextButtonDisabled = useMemo(() => {
//     switch (activeStep) {
//       case 0:
//         return !ephemeralKeyPair;
//       case 1:
//         return !currentEpoch || !randomness;
//       case 2:
//         return !jwtString;
//       case 3:
//         return !userSalt;
//       case 4:
//         return !zkLoginUserAddress;
//       case 5:
//         return !zkProof;
//       case 6:
//         return true;
//       default:
//         return true;
//     }
//   }, [
//     currentEpoch,
//     randomness,
//     activeStep,
//     jwtString,
//     ephemeralKeyPair,
//     zkLoginUserAddress,
//     zkProof,
//     userSalt,
//   ]);

//   // query zkLogin address balance
//   const { data: addressBalance } = useSuiClientQuery(
//     "getBalance",
//     {
//       owner: zkLoginUserAddress,
//     },
//     {
//       enabled: Boolean(zkLoginUserAddress),
//       refetchInterval: 1500,
//     }
//   );

//   const resetState = () => {
//     // Clear all stored data
//     window.localStorage.removeItem(JWT_TOKEN_STORAGE_KEY);
//     window.localStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
//     window.localStorage.removeItem(ZK_PROOF_STORAGE_KEY);
//     window.localStorage.removeItem(FAUCET_STATUS_STORAGE_KEY);
//     window.localStorage.removeItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
//     window.localStorage.removeItem(USER_SALT_LOCAL_STORAGE_KEY);
//     window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
//     window.sessionStorage.removeItem(RANDOMNESS_SESSION_STORAGE_KEY);

//     // Reset all state
//     setCurrentEpoch("");
//     setNonce("");
//     setOauthParams(undefined);
//     setZkLoginUserAddress("");
//     setDecodedJwt(undefined);
//     setJwtString("");
//     setEphemeralKeyPair(undefined);
//     setUserSalt(undefined);
//     setZkProof(undefined);
//     setExtendedEphemeralPublicKey("");
//     setMaxEpoch(0);
//     setRandomness("");
//     setActiveStep(0);
//     setFetchingZKProof(false);
//     setExecutingTxn(false);
//     setExecuteDigest("");
//     setHasFaucetRequested(false);
//   };

//   const resetLocalState = () => {
//     try {
//       window.sessionStorage.clear();
//       window.localStorage.clear();
//       resetState();
//       setShowResetDialog(false);
//       navigate(`/`);
//       setActiveStep(0);
//       enqueueSnackbar("Reset successful", {
//         variant: "success",
//       });
//     } catch (error) {
//       enqueueSnackbar(String(error), {
//         variant: "error",
//       });
//     }
//   };

//   const [requestingFaucet, setRequestingFaucet] = useState(false);

//   const requestFaucet = async () => {
//     if (!zkLoginUserAddress || hasFaucetRequested) {
//       return;
//     }
//     try {
//       setRequestingFaucet(true);
//       await axios.post(SUI_DEVNET_FAUCET, {
//         FixedAmountRequest: {
//           recipient: zkLoginUserAddress,
//         },
//       });
//       setHasFaucetRequested(true);
//       enqueueSnackbar("Successfully received test tokens!", {
//         variant: "success",
//       });
//     } catch (error) {
//       console.error(error);
//       const err = error as { response?: { data?: { message?: string } } };
//       enqueueSnackbar(String(err?.response?.data?.message || error), {
//         variant: "error",
//       });
//     } finally {
//       setRequestingFaucet(false);
//     }
//   };

//   // Auto generate user salt and address when JWT is available
//   useEffect(() => {
//     if (decodedJwt?.email && !userSalt) {
//       // Generate deterministic salt based on email
//       const newSalt = generateDeterministicSalt(decodedJwt.email);
//       window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
//       setUserSalt(newSalt);
//     }

//     if (jwtString && userSalt && !zkLoginUserAddress) {
//       // Generate zkLogin address
//       const newAddress = jwtToAddress(jwtString, userSalt);
//       setZkLoginUserAddress(newAddress);
//     }
//   }, [decodedJwt, jwtString, userSalt, zkLoginUserAddress]);

//   // Auto generate extended ephemeral public key and fetch ZK proof
//   useEffect(() => {
//     const generateProof = async () => {
//       if (!ephemeralKeyPair || !zkLoginUserAddress || !maxEpoch || !randomness || !userSalt || !oauthParams?.id_token) {
//         return;
//       }

//       try {
//         // Generate extended ephemeral public key
//         const newExtendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
//           ephemeralKeyPair.getPublicKey()
//         );
//         setExtendedEphemeralPublicKey(newExtendedEphemeralPublicKey);

//         // Fetch ZK proof if not already present
//         if (!zkProof) {
//           setFetchingZKProof(true);
//           const zkProofResult = await axios.post(
//             SUI_PROVER_DEV_ENDPOINT,
//             {
//               jwt: oauthParams.id_token,
//               extendedEphemeralPublicKey: newExtendedEphemeralPublicKey,
//               maxEpoch: maxEpoch,
//               jwtRandomness: randomness,
//               salt: userSalt,
//               keyClaimName: "sub",
//             },
//             {
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             }
//           );
//           setZkProof(zkProofResult.data as PartialZkLoginSignature);
//           enqueueSnackbar("Successfully obtained ZK Proof", {
//             variant: "success",
//           });
//         }
//       } catch (err) {
//         console.error(err);
//         const error = err as { response?: { data?: { message?: string } } };
//         enqueueSnackbar(String(error?.response?.data?.message || err), {
//           variant: "error",
//         });
//       } finally {
//         setFetchingZKProof(false);
//       }
//     };

//     generateProof();
//   }, [ephemeralKeyPair, zkLoginUserAddress, maxEpoch, randomness, userSalt, oauthParams?.id_token]);

//   // Auto advance steps when data is available
//   useEffect(() => {
//     if (activeStep === 2 && jwtString) {
//       setActiveStep(3);
//     }
//     if (activeStep === 3 && userSalt) {
//       setActiveStep(4);
//     }
//     if (activeStep === 4 && zkLoginUserAddress) {
//       setActiveStep(5);
//     }
//     if (activeStep === 5 && zkProof) {
//       setActiveStep(6);
//     }
//   }, [activeStep, jwtString, userSalt, zkLoginUserAddress, zkProof]);

//   // Auto request faucet when address is generated
//   useEffect(() => {
//     const autoRequestFaucet = async () => {
//       if (!zkLoginUserAddress || requestingFaucet || hasFaucetRequested) {
//         return;
//       }
//       try {
//         setRequestingFaucet(true);
//         await axios.post(SUI_DEVNET_FAUCET, {
//           FixedAmountRequest: {
//             recipient: zkLoginUserAddress,
//           },
//         });
//         setHasFaucetRequested(true);
//         enqueueSnackbar("Successfully received test tokens!", {
//           variant: "success",
//         });
//       } catch (error) {
//         console.error(error);
//         const err = error as { response?: { data?: { message?: string } } };
//         enqueueSnackbar(String(err?.response?.data?.message || error), {
//           variant: "error",
//         });
//       } finally {
//         setRequestingFaucet(false);
//       }
//     };

//     autoRequestFaucet();
//   }, [zkLoginUserAddress]);

//   // Add session expiry check
//   useEffect(() => {
//     const checkSession = () => {
//       if (jwtString) {
//         try {
//           const decodedToken = jwtDecode(jwtString);
//           const expirationTime = (decodedToken.exp || 0) * 1000; // Convert to milliseconds
          
//           if (Date.now() >= expirationTime) {
//             enqueueSnackbar('Session expired. Please sign in again.', { 
//               variant: 'warning',
//               autoHideDuration: 5000
//             });
//             resetState();
//           }
//         } catch (error) {
//           console.error('Error checking session:', error);
//         }
//       }
//     };

//     // Check immediately and then every minute
//     checkSession();
//     const interval = setInterval(checkSession, 60000);

//     return () => clearInterval(interval);
//   }, [jwtString]);

//   const handleTransaction = async () => {
//     try {
//       if (!ephemeralKeyPair || !zkProof || !decodedJwt || !userSalt) {
//         enqueueSnackbar('Missing required wallet data', { variant: 'error' });
//         return;
//       }

//       setExecutingTxn(true);
//       const txb = new TransactionBlock();

//       // Create a test transaction (sending 1 SUI)
//       const [coin] = txb.splitCoins(txb.gas, [1000000000]); // 1 SUI = 1000000000 MIST
//       txb.transferObjects(
//         [coin],
//         "0xfa0f8542f256e669694624aa3ee7bfbde5af54641646a3a05924cf9e329a8a36" // Example recipient
//       );
//       txb.setSender(zkLoginUserAddress);

//       // Sign the transaction with ephemeral key pair
//       const { bytes, signature: userSignature } = await txb.sign({
//         client: suiClient,
//         signer: ephemeralKeyPair,
//       });

//       if (!decodedJwt.sub || !decodedJwt.aud) {
//         throw new Error('Invalid JWT data');
//       }

//       // Generate address seed
//       const addressSeed = genAddressSeed(
//         BigInt(userSalt),
//         'sub',
//         decodedJwt.sub,
//         decodedJwt.aud as string
//       ).toString();

//       // Create zkLogin signature
//       const zkLoginSignature: SerializedSignature = getZkLoginSignature({
//         inputs: {
//           ...zkProof,
//           addressSeed,
//         },
//         maxEpoch,
//         userSignature,
//       });

//       // Execute the transaction
//       const executeRes = await suiClient.executeTransactionBlock({
//         transactionBlock: bytes,
//         signature: zkLoginSignature,
//       });

//       enqueueSnackbar('Transaction successful!', { variant: 'success' });
//       setExecuteDigest(executeRes.digest);

//     } catch (error) {
//       console.error('Transaction error:', error);
//       enqueueSnackbar(
//         error instanceof Error ? error.message : 'Transaction failed', 
//         { variant: 'error' }
//       );
//     } finally {
//       setExecutingTxn(false);
//     }
//   };

//   // Add email verification to Google sign-in
//   const handleGoogleSignIn = () => {
//     const params = new URLSearchParams({
//       client_id: CLIENT_ID,
//       redirect_uri: REDIRECT_URI,
//       response_type: "id_token",
//       scope: "openid email", // Add email to scope
//       nonce: nonce,
//     });
//     window.location.replace(
//       `https://accounts.google.com/o/oauth2/v2/auth?${params}`
//     );
//   };

//   return (
//     <Box sx={{ 
//       maxWidth: '1200px', 
//       margin: '0 auto', 
//       padding: { xs: '16px', sm: '24px' }
//     }}>
//       {/* Header Section */}
//       <Box sx={{ 
//         display: 'flex', 
//         flexDirection: { xs: 'column', sm: 'row' },
//         justifyContent: 'space-between', 
//         alignItems: { xs: 'stretch', sm: 'center' },
//         gap: { xs: 2, sm: 0 },
//         mb: 4,
//         borderBottom: '1px solid',
//         borderColor: 'divider',
//         pb: 2
//       }}>
//         <Typography variant="h4" fontWeight="bold" sx={{
//           fontSize: { xs: '1.5rem', sm: '2rem' }
//         }}>
//           Sui Wallet
//         </Typography>
        
//         <Stack 
//           direction={{ xs: 'column', sm: 'row' }}
//           spacing={2} 
//           alignItems={{ xs: 'stretch', sm: 'center' }}
//         >
//           <ButtonGroup 
//             size="small" 
//             sx={{ 
//               width: { xs: '100%', sm: 'auto' }
//             }}
//           >
//             <Button 
//               variant={lang === "en" ? "contained" : "outlined"}
//               onClick={() => setLang("en")}
//               sx={{ flex: { xs: 1, sm: 'initial' } }}
//             >
//               ENG
//             </Button>
//             <Button 
//               variant={lang === "zh" ? "contained" : "outlined"}
//               onClick={() => setLang("zh")}
//               sx={{ flex: { xs: 1, sm: 'initial' } }}
//             >
//               中文
//             </Button>
//           </ButtonGroup>
          
//           <Button
//             variant="outlined"
//             color="error"
//             size="small"
//             onClick={() => setShowResetDialog(true)}
//             sx={{ 
//               width: { xs: '100%', sm: 'auto' }
//             }}
//           >
//             Reset
//           </Button>
//         </Stack>
//       </Box>

//       {isInitializing ? (
//         <Box sx={{ 
//           display: 'flex', 
//           flexDirection: 'column', 
//           alignItems: 'center',
//           justifyContent: 'center',
//           minHeight: '400px',
//           gap: 2
//         }}>
//           <CircularProgress />
//           <Typography color="text.secondary">
//             Initializing wallet...
//           </Typography>
//         </Box>
//       ) : (
//         <Box sx={{ 
//           display: 'flex', 
//           flexDirection: { xs: 'column', md: 'row' },
//           gap: { xs: 2, md: 4 }
//         }}>
//           {/* Left Panel - Auth Status */}
//           <Box sx={{ flex: 1, width: '100%' }}>
//             {!zkLoginUserAddress ? (
//               <Paper sx={{ 
//                 p: { xs: 2, sm: 3 }, 
//                 borderRadius: 2,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: 2
//               }}>
//                 <Typography variant="h6">
//                   {t("Login to Your Wallet")}
//                 </Typography>
                
//                 <Typography color="text.secondary" variant="body2">
//                   Connect with Google to access your Sui wallet. Your account will be secured using zkLogin technology.
//                 </Typography>

//                 {!nonce ? (
//                   <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
//                     <CircularProgress size={24} />
//                   </Box>
//                 ) : (
//                   <Button
//                     fullWidth
//                     variant="contained"
//                     onClick={handleGoogleSignIn}
//                     sx={{ 
//                       py: { xs: 1.5, sm: 2 },
//                       bgcolor: '#4285F4',
//                       '&:hover': {
//                         bgcolor: '#3367D6'
//                       }
//                     }}
//                   >
//                     <img
//                       src={GoogleLogo}
//                       width="20px"
//                       style={{ marginRight: "8px" }}
//                       alt="Google"
//                     />
//                     Sign In With Google
//                   </Button>
//                 )}

//                 <Typography variant="caption" color="text.secondary" align="center">
//                   By connecting, you agree to our Terms of Service
//                 </Typography>
//               </Paper>
//             ) : (
//               <Paper sx={{ 
//                 p: { xs: 2, sm: 3 }, 
//                 borderRadius: 2 
//               }}>
//                 {decodedJwt?.email && (
//                   <Box sx={{ mb: 3 }}>
//                     <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                       Connected Account
//                     </Typography>
//                     <Box sx={{ 
//                       display: 'flex', 
//                       alignItems: 'center',
//                       gap: 1,
//                       color: 'success.main'
//                     }}>
//                       <CheckCircleIcon fontSize="small" />
//                       <Typography>{decodedJwt.email}</Typography>
//                     </Box>
//                   </Box>
//                 )}

//                 <Box sx={{ mb: 3 }}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Wallet Address
//                   </Typography>
//                   <Box sx={{ 
//                     display: 'flex', 
//                     alignItems: 'center',
//                     gap: 1,
//                     bgcolor: 'action.hover',
//                     p: 1,
//                     borderRadius: 1
//                   }}>
//                     <Typography
//                       sx={{
//                         fontFamily: "monospace",
//                         fontSize: { xs: '0.75rem', sm: '0.875rem' },
//                         wordBreak: "break-all"
//                       }}
//                     >
//                       {zkLoginUserAddress}
//                     </Typography>
//                     <IconButton 
//                       size="small"
//                       onClick={() => {
//                         navigator.clipboard.writeText(zkLoginUserAddress);
//                         enqueueSnackbar('Address copied to clipboard', { variant: 'success' });
//                       }}
//                     >
//                       <ContentCopyIcon fontSize="small" />
//                     </IconButton>
//                   </Box>
//                 </Box>

//                 <Box sx={{ mb: 3 }}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Balance
//                   </Typography>
//                   {addressBalance ? (
//                     <Typography variant="h5">
//                       {BigNumber(addressBalance?.totalBalance)
//                         .div(MIST_PER_SUI.toString())
//                         .toFixed(6)} SUI
//                     </Typography>
//                   ) : (
//                     <Skeleton variant="text" width={150} height={40} />
//                   )}
//                 </Box>

//                 <LoadingButton
//                   loading={executingTxn}
//                   variant="contained"
//                   fullWidth
//                   disabled={!addressBalance || addressBalance.totalBalance === '0'}
//                   onClick={handleTransaction}
//                   sx={{ mb: 2 }}
//                 >
//                   Send Transaction
//                 </LoadingButton>

//                 {executeDigest && (
//                   <Alert 
//                     severity="success" 
//                     sx={{ 
//                       '& .MuiAlert-message': {
//                         width: '100%'
//                       }
//                     }}
//                   >
//                     <Typography variant="subtitle2" gutterBottom>
//                       Transaction successful
//                     </Typography>
//                     <Link
//                       href={`https://suiexplorer.com/txblock/${executeDigest}?network=devnet`}
//                       target="_blank"
//                       sx={{ 
//                         wordBreak: "break-all",
//                         display: 'block'
//                       }}
//                     >
//                       View on Explorer →
//                     </Link>
//                   </Alert>
//                 )}
//               </Paper>
//             )}
//           </Box>

//           {/* Right Panel - Network Info */}
//           <Paper sx={{ 
//             p: { xs: 2, sm: 3 }, 
//             borderRadius: 2,
//             width: { xs: '100%', md: '300px' },
//             height: 'fit-content'
//           }}>
//             <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//               Network Status
//             </Typography>
            
//             <Stack spacing={2}>
//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   Network
//                 </Typography>
//                 <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                   <Box
//                     sx={{
//                       width: 8,
//                       height: 8,
//                       borderRadius: '50%',
//                       bgcolor: 'success.main'
//                     }}
//                   />
//                   <Typography variant="body2">Devnet</Typography>
//                 </Box>
//               </Box>
              
//               <Box>
//                 <Typography variant="caption" color="text.secondary" display="block">
//                   Current Epoch
//                 </Typography>
//                 {currentEpoch ? (
//                   <Typography variant="body2">{currentEpoch}</Typography>
//                 ) : (
//                   <Skeleton width={60} />
//                 )}
//               </Box>

//               {zkLoginUserAddress && (
//                 <LoadingButton
//                   loading={requestingFaucet}
//                   variant="outlined"
//                   size="small"
//                   onClick={requestFaucet}
//                   disabled={hasFaucetRequested}
//                   sx={{ 
//                     py: { xs: 1.5, sm: 1 }
//                   }}
//                 >
//                   {hasFaucetRequested ? (
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
//                       <CheckCircleIcon color="success" fontSize="small" />
//                       Test Tokens Received
//                     </Box>
//                   ) : (
//                     "Request Test Tokens"
//                   )}
//                 </LoadingButton>
//               )}
//             </Stack>
//           </Paper>
//         </Box>
//       )}

//       {/* Reset Dialog - Enhanced version */}
//       <Dialog 
//         open={showResetDialog} 
//         onClose={() => setShowResetDialog(false)}
//         sx={{
//           '& .MuiDialog-paper': {
//             width: { xs: '90%', sm: 'auto' },
//             m: { xs: 2, sm: 3 }
//           }
//         }}
//       >
//         <DialogTitle sx={{ 
//           fontSize: { xs: '1.1rem', sm: '1.25rem' },
//           pb: 1
//         }}>
//           Reset Wallet
//         </DialogTitle>
//         <DialogContent>
//           <Alert severity="warning" sx={{ mb: 2 }}>
//             This action cannot be undone.
//           </Alert>
//           <DialogContentText sx={{ 
//             fontSize: { xs: '0.875rem', sm: '1rem' }
//           }}>
//             Resetting your wallet will:
//             <ul>
//               <li>Clear all stored data</li>
//               <li>Remove your wallet address</li>
//               <li>Require you to sign in again</li>
//             </ul>
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions sx={{ 
//           p: { xs: 2, sm: 3 },
//           gap: 1
//         }}>
//           <Button
//             onClick={() => setShowResetDialog(false)}
//             variant="outlined"
//             sx={{ minWidth: { xs: '80px', sm: '100px' } }}
//           >
//             Cancel
//           </Button>
//           <Button
//             onClick={resetLocalState}
//             variant="contained"
//             color="error"
//             sx={{ minWidth: { xs: '80px', sm: '100px' } }}
//           >
//             Reset
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }

// export default App;

//v2

// import { LoadingButton } from "@mui/lab";
// import {
//   Alert,
//   Box,
//   Button,
//   ButtonGroup,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
//   Stack,
//   Typography,
//   Paper,
//   CircularProgress,
//   Link,
//   IconButton,
//   Skeleton,
// } from "@mui/material";
// import { fromB64 } from "@mysten/bcs";
// import { useSuiClientQuery } from "@mysten/dapp-kit";
// import { SuiClient } from "@mysten/sui.js/client";
// import { SerializedSignature } from "@mysten/sui.js/cryptography";
// import { Ed25519Keypair } from "@mysten/sui.js/keypairs/ed25519";
// import { TransactionBlock } from "@mysten/sui.js/transactions";
// import { MIST_PER_SUI } from "@mysten/sui.js/utils";
// import {
//   genAddressSeed,
//   generateNonce,
//   generateRandomness,
//   getExtendedEphemeralPublicKey,
//   getZkLoginSignature,
//   jwtToAddress,
// } from "@mysten/zklogin";
// import axios from "axios";
// import { BigNumber } from "bignumber.js";
// import { JwtPayload, jwtDecode } from "jwt-decode";
// import { enqueueSnackbar } from "notistack";
// import queryString from "query-string";
// import { useEffect, useMemo, useState } from "react";
// import { Trans, useTranslation } from "react-i18next";
// import { useLocation, useNavigate } from "react-router-dom";
// import "./App.css";
// import GoogleLogo from "./assets/google.svg";
// import { FaCoins } from 'react-icons/fa';
// import { AiOutlineHome, AiOutlineInfoCircle } from 'react-icons/ai';
// import { BiNetworkChart } from 'react-icons/bi';
// import { RiMessage3Line } from 'react-icons/ri';
// import { QRCodeSVG } from 'qrcode.react';
// import { FiLogOut } from 'react-icons/fi';

// import {
//   CLIENT_ID,
//   FULLNODE_URL,
//   KEY_PAIR_SESSION_STORAGE_KEY,
//   MAX_EPOCH_LOCAL_STORAGE_KEY,
//   RANDOMNESS_SESSION_STORAGE_KEY,
//   REDIRECT_URI,
//   SUI_DEVNET_FAUCET,
//   SUI_PROVER_DEV_ENDPOINT,
//   USER_SALT_LOCAL_STORAGE_KEY,
// } from "./constant";
// import ContentCopyIcon from "@mui/icons-material/ContentCopy";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";

// interface ExtendedJwtPayload extends JwtPayload {
//   email?: string;
// }

// export type PartialZkLoginSignature = Omit<
//   Parameters<typeof getZkLoginSignature>["0"]["inputs"],
//   "addressSeed"
// >;

// const suiClient = new SuiClient({ url: FULLNODE_URL });

// const JWT_TOKEN_STORAGE_KEY = 'zklogin_jwt_token';
// const WALLET_ADDRESS_STORAGE_KEY = 'zklogin_wallet_address';
// const ZK_PROOF_STORAGE_KEY = 'zklogin_zk_proof';
// const FAUCET_STATUS_STORAGE_KEY = 'zklogin_faucet_requested';

// const generateDeterministicSalt = (email: string): string => {
//   // Create a deterministic salt based on email
//   const encoder = new TextEncoder();
//   const data = encoder.encode(email);
//   let hash = 0;
//   for (let i = 0; i < data.length; i++) {
//     hash = ((hash << 5) - hash) + data[i];
//     hash = hash & hash; // Convert to 32-bit integer
//   }
//   return Math.abs(hash).toString();
// };

// function App() {
//   const { t, i18n } = useTranslation();
//   const [showResetDialog, setShowResetDialog] = useState(false);
//   const [currentEpoch, setCurrentEpoch] = useState("");
//   const [nonce, setNonce] = useState("");
//   const [oauthParams, setOauthParams] =
//     useState<queryString.ParsedQuery<string>>();
//   const [zkLoginUserAddress, setZkLoginUserAddress] = useState("");
//   const [decodedJwt, setDecodedJwt] = useState<ExtendedJwtPayload>();
//   const [jwtString, setJwtString] = useState("");
//   const [ephemeralKeyPair, setEphemeralKeyPair] = useState<Ed25519Keypair>();
//   const [userSalt, setUserSalt] = useState<string>();
//   const [zkProof, setZkProof] = useState<PartialZkLoginSignature>();
//   const [extendedEphemeralPublicKey, setExtendedEphemeralPublicKey] =
//     useState("");
//   const [maxEpoch, setMaxEpoch] = useState(0);
//   const [randomness, setRandomness] = useState("");
//   const [activeStep, setActiveStep] = useState(0);
//   const [fetchingZKProof, setFetchingZKProof] = useState(false);
//   const [executingTxn, setExecutingTxn] = useState(false);
//   const [executeDigest, setExecuteDigest] = useState("");
//   const [lang, setLang] = useState<"zh" | "en">("en");
//   const [hasFaucetRequested, setHasFaucetRequested] = useState(false);
//   const [isInitializing, setIsInitializing] = useState(true);
//   const [activeTab, setActiveTab] = useState('home');
//   const [openReceiveModal, setOpenReceiveModal] = useState(false);
//   const [copied, setCopied] = useState(false);

//   const location = useLocation();
//   const navigate = useNavigate();

//   // Change lng
//   useEffect(() => {
//     i18n.changeLanguage(lang);
//   }, [i18n, lang]);

//   useEffect(() => {
//     const res = queryString.parse(location.hash);
//     setOauthParams(res);
//   }, [location]);

//   // query jwt id_token
//   useEffect(() => {
//     if (oauthParams && oauthParams.id_token) {
//       const decodedJwt = jwtDecode(oauthParams.id_token as string);
//       setJwtString(oauthParams.id_token as string);
//       setDecodedJwt(decodedJwt);
//       setActiveStep(2);
//     }
//   }, [oauthParams]);

//   // Enhance initial setup effect
//   useEffect(() => {
//     const initializeWallet = async () => {
//       try {
//         setIsInitializing(true);
        
//         // Restore JWT and decoded data
//         const storedJwt = window.localStorage.getItem(JWT_TOKEN_STORAGE_KEY);
//         if (storedJwt) {
//           setJwtString(storedJwt);
//           const decoded = jwtDecode(storedJwt) as ExtendedJwtPayload;
//           setDecodedJwt(decoded);
          
//           // Generate salt from email if available
//           if (decoded.email && !userSalt) {
//             const newSalt = generateDeterministicSalt(decoded.email);
//             window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
//             setUserSalt(newSalt);
//           }
//         }

//         // Restore wallet address
//         const storedAddress = window.localStorage.getItem(WALLET_ADDRESS_STORAGE_KEY);
//         if (storedAddress) {
//           setZkLoginUserAddress(storedAddress);
//         }

//         // Restore ZK proof
//         const storedZkProof = window.localStorage.getItem(ZK_PROOF_STORAGE_KEY);
//         if (storedZkProof) {
//           setZkProof(JSON.parse(storedZkProof));
//         }

//         // Restore faucet status
//         const storedFaucetStatus = window.localStorage.getItem(FAUCET_STATUS_STORAGE_KEY);
//         if (storedFaucetStatus) {
//           setHasFaucetRequested(JSON.parse(storedFaucetStatus));
//         }

//         // Fetch and set current epoch
//         const { epoch } = await suiClient.getLatestSuiSystemState();
//         setCurrentEpoch(epoch);
//         const newMaxEpoch = Number(epoch) + 10;
//         window.localStorage.setItem(MAX_EPOCH_LOCAL_STORAGE_KEY, String(newMaxEpoch));
//         setMaxEpoch(newMaxEpoch);

//         // Setup keypair
//         const privateKey = window.sessionStorage.getItem(KEY_PAIR_SESSION_STORAGE_KEY);
//         if (privateKey) {
//           const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
//           setEphemeralKeyPair(ephemeralKeyPair);
//         } else {
//           const newEphemeralKeyPair = Ed25519Keypair.generate();
//           window.sessionStorage.setItem(
//             KEY_PAIR_SESSION_STORAGE_KEY,
//             newEphemeralKeyPair.export().privateKey
//           );
//           setEphemeralKeyPair(newEphemeralKeyPair);
//         }

//         // Setup randomness
//         const storedRandomness = window.sessionStorage.getItem(RANDOMNESS_SESSION_STORAGE_KEY);
//         if (storedRandomness) {
//           setRandomness(storedRandomness);
//         } else {
//           const newRandomness = generateRandomness();
//           window.sessionStorage.setItem(RANDOMNESS_SESSION_STORAGE_KEY, newRandomness);
//           setRandomness(newRandomness);
//         }

//         // Restore user salt
//         const storedUserSalt = window.localStorage.getItem(USER_SALT_LOCAL_STORAGE_KEY);
//         if (storedUserSalt) {
//           setUserSalt(storedUserSalt);
//         }

//       } catch (error) {
//         console.error('Initialization error:', error);
//         enqueueSnackbar('Failed to initialize wallet. Please try again.', { 
//           variant: 'error',
//           action: (key) => (
//             <Button color="inherit" size="small" onClick={() => window.location.reload()}>
//               Retry
//             </Button>
//           )
//         });
//       } finally {
//         setIsInitializing(false);
//       }
//     };

//     initializeWallet();
//   }, []);

//   // Add effects to persist data when it changes
//   useEffect(() => {
//     if (jwtString) {
//       window.localStorage.setItem(JWT_TOKEN_STORAGE_KEY, jwtString);
//     }
//   }, [jwtString]);

//   useEffect(() => {
//     if (zkLoginUserAddress) {
//       window.localStorage.setItem(WALLET_ADDRESS_STORAGE_KEY, zkLoginUserAddress);
//     }
//   }, [zkLoginUserAddress]);

//   useEffect(() => {
//     if (zkProof) {
//       window.localStorage.setItem(ZK_PROOF_STORAGE_KEY, JSON.stringify(zkProof));
//     }
//   }, [zkProof]);

//   useEffect(() => {
//     window.localStorage.setItem(FAUCET_STATUS_STORAGE_KEY, JSON.stringify(hasFaucetRequested));
//   }, [hasFaucetRequested]);

//   // Auto generate nonce when we have all required values
//   useEffect(() => {
//     if (ephemeralKeyPair && maxEpoch && randomness && !nonce) {
//       const newNonce = generateNonce(
//         ephemeralKeyPair.getPublicKey(),
//         maxEpoch,
//         randomness
//       );
//       setNonce(newNonce);
//     }
//   }, [ephemeralKeyPair, maxEpoch, randomness, nonce]);

//   const nextButtonDisabled = useMemo(() => {
//     switch (activeStep) {
//       case 0:
//         return !ephemeralKeyPair;
//       case 1:
//         return !currentEpoch || !randomness;
//       case 2:
//         return !jwtString;
//       case 3:
//         return !userSalt;
//       case 4:
//         return !zkLoginUserAddress;
//       case 5:
//         return !zkProof;
//       case 6:
//         return true;
//       default:
//         return true;
//     }
//   }, [
//     currentEpoch,
//     randomness,
//     activeStep,
//     jwtString,
//     ephemeralKeyPair,
//     zkLoginUserAddress,
//     zkProof,
//     userSalt,
//   ]);

//   // query zkLogin address balance
//   const { data: addressBalance } = useSuiClientQuery(
//     "getBalance",
//     {
//       owner: zkLoginUserAddress,
//     },
//     {
//       enabled: Boolean(zkLoginUserAddress),
//       refetchInterval: 1500,
//     }
//   );

//   const resetState = () => {
//     // Clear all stored data
//     window.localStorage.removeItem(JWT_TOKEN_STORAGE_KEY);
//     window.localStorage.removeItem(WALLET_ADDRESS_STORAGE_KEY);
//     window.localStorage.removeItem(ZK_PROOF_STORAGE_KEY);
//     window.localStorage.removeItem(FAUCET_STATUS_STORAGE_KEY);
//     window.localStorage.removeItem(MAX_EPOCH_LOCAL_STORAGE_KEY);
//     window.localStorage.removeItem(USER_SALT_LOCAL_STORAGE_KEY);
//     window.sessionStorage.removeItem(KEY_PAIR_SESSION_STORAGE_KEY);
//     window.sessionStorage.removeItem(RANDOMNESS_SESSION_STORAGE_KEY);

//     // Reset all state
//     setCurrentEpoch("");
//     setNonce("");
//     setOauthParams(undefined);
//     setZkLoginUserAddress("");
//     setDecodedJwt(undefined);
//     setJwtString("");
//     setEphemeralKeyPair(undefined);
//     setUserSalt(undefined);
//     setZkProof(undefined);
//     setExtendedEphemeralPublicKey("");
//     setMaxEpoch(0);
//     setRandomness("");
//     setActiveStep(0);
//     setFetchingZKProof(false);
//     setExecutingTxn(false);
//     setExecuteDigest("");
//     setHasFaucetRequested(false);
//   };

//   const resetLocalState = () => {
//     try {
//       window.sessionStorage.clear();
//       window.localStorage.clear();
//       resetState();
//       setShowResetDialog(false);
//       navigate(`/`);
//       setActiveStep(0);
//       enqueueSnackbar("Reset successful", {
//         variant: "success",
//       });
//     } catch (error) {
//       enqueueSnackbar(String(error), {
//         variant: "error",
//       });
//     }
//   };

//   const [requestingFaucet, setRequestingFaucet] = useState(false);

//   const requestFaucet = async () => {
//     if (!zkLoginUserAddress || hasFaucetRequested) {
//       return;
//     }
//     try {
//       setRequestingFaucet(true);
//       await axios.post(SUI_DEVNET_FAUCET, {
//         FixedAmountRequest: {
//           recipient: zkLoginUserAddress,
//         },
//       });
//       setHasFaucetRequested(true);
//       enqueueSnackbar("Successfully received test tokens!", {
//         variant: "success",
//       });
//     } catch (error) {
//       console.error(error);
//       const err = error as { response?: { data?: { message?: string } } };
//       enqueueSnackbar(String(err?.response?.data?.message || error), {
//         variant: "error",
//       });
//     } finally {
//       setRequestingFaucet(false);
//     }
//   };

//   // Auto generate user salt and address when JWT is available
//   useEffect(() => {
//     if (decodedJwt?.email && !userSalt) {
//       // Generate deterministic salt based on email
//       const newSalt = generateDeterministicSalt(decodedJwt.email);
//       window.localStorage.setItem(USER_SALT_LOCAL_STORAGE_KEY, newSalt);
//       setUserSalt(newSalt);
//     }

//     if (jwtString && userSalt && !zkLoginUserAddress) {
//       // Generate zkLogin address
//       const newAddress = jwtToAddress(jwtString, userSalt);
//       setZkLoginUserAddress(newAddress);
//     }
//   }, [decodedJwt, jwtString, userSalt, zkLoginUserAddress]);

//   // Auto generate extended ephemeral public key and fetch ZK proof
//   useEffect(() => {
//     const generateMissingData = async () => {
//       if (!ephemeralKeyPair || !zkLoginUserAddress || !maxEpoch || !randomness || !userSalt || !oauthParams?.id_token) {
//         return;
//       }

//       try {
//         // Generate extended ephemeral public key if not already set
//         if (!extendedEphemeralPublicKey) {
//           const newExtendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
//             ephemeralKeyPair.getPublicKey()
//           );
//           setExtendedEphemeralPublicKey(newExtendedEphemeralPublicKey);
//         }

//         // Fetch ZK proof if not already present
//         if (!zkProof) {
//           setFetchingZKProof(true);
//           const zkProofResult = await axios.post(
//             SUI_PROVER_DEV_ENDPOINT,
//             {
//               jwt: oauthParams.id_token,
//               extendedEphemeralPublicKey: extendedEphemeralPublicKey || getExtendedEphemeralPublicKey(ephemeralKeyPair.getPublicKey()),
//               maxEpoch: maxEpoch,
//               jwtRandomness: randomness,
//               salt: userSalt,
//               keyClaimName: "sub",
//             },
//             {
//               headers: {
//                 "Content-Type": "application/json",
//               },
//             }
//           );
//           setZkProof(zkProofResult.data as PartialZkLoginSignature);
//           enqueueSnackbar("Successfully obtained ZK Proof", {
//             variant: "success",
//           });
//         }
//       } catch (err) {
//         console.error(err);
//         const error = err as { response?: { data?: { message?: string } } };
//         enqueueSnackbar(String(error?.response?.data?.message || err), {
//           variant: "error",
//         });
//       } finally {
//         setFetchingZKProof(false);
//       }
//     };

//     generateMissingData();
//   }, [ephemeralKeyPair, zkLoginUserAddress, maxEpoch, randomness, userSalt, oauthParams?.id_token, extendedEphemeralPublicKey, zkProof]);

//   // Auto advance steps when data is available
//   useEffect(() => {
//     if (activeStep === 2 && jwtString) {
//       setActiveStep(3);
//     }
//     if (activeStep === 3 && userSalt) {
//       setActiveStep(4);
//     }
//     if (activeStep === 4 && zkLoginUserAddress) {
//       setActiveStep(5);
//     }
//     if (activeStep === 5 && zkProof) {
//       setActiveStep(6);
//     }
//   }, [activeStep, jwtString, userSalt, zkLoginUserAddress, zkProof]);

//   // Auto request faucet when address is generated
//   useEffect(() => {
//     const autoRequestFaucet = async () => {
//       if (!zkLoginUserAddress || requestingFaucet || hasFaucetRequested) {
//         return;
//       }
//       try {
//         setRequestingFaucet(true);
//         await axios.post(SUI_DEVNET_FAUCET, {
//           FixedAmountRequest: {
//             recipient: zkLoginUserAddress,
//           },
//         });
//         setHasFaucetRequested(true);
//         enqueueSnackbar("Successfully received test tokens!", {
//           variant: "success",
//         });
//       } catch (error) {
//         console.error(error);
//         const err = error as { response?: { data?: { message?: string } } };
//         enqueueSnackbar(String(err?.response?.data?.message || error), {
//           variant: "error",
//         });
//       } finally {
//         setRequestingFaucet(false);
//       }
//     };

//     autoRequestFaucet();
//   }, [zkLoginUserAddress]);

//   // Add session expiry check
//   useEffect(() => {
//     const checkSession = () => {
//       if (jwtString) {
//         try {
//           const decodedToken = jwtDecode(jwtString);
//           const expirationTime = (decodedToken.exp || 0) * 1000; // Convert to milliseconds
          
//           if (Date.now() >= expirationTime) {
//             enqueueSnackbar('Session expired. Please sign in again.', { 
//               variant: 'warning',
//               autoHideDuration: 5000
//             });
//             resetState();
//           }
//         } catch (error) {
//           console.error('Error checking session:', error);
//         }
//       }
//     };

//     // Check immediately and then every minute
//     checkSession();
//     const interval = setInterval(checkSession, 60000);

//     return () => clearInterval(interval);
//   }, [jwtString]);

//   const handleTransaction = async () => {
//     try {
//       if (!ephemeralKeyPair || !zkProof || !decodedJwt || !userSalt) {
//         enqueueSnackbar('Missing required wallet data', { variant: 'error' });
//         return;
//       }

//       setExecutingTxn(true);
//       const txb = new TransactionBlock();

//       // Create a test transaction (sending 1 SUI)
//       const [coin] = txb.splitCoins(txb.gas, [1000000000]); // 1 SUI = 1000000000 MIST
//       txb.transferObjects(
//         [coin],
//         "0xfa0f8542f256e669694624aa3ee7bfbde5af54641646a3a05924cf9e329a8a36" // Example recipient
//       );
//       txb.setSender(zkLoginUserAddress);

//       // Sign the transaction with ephemeral key pair
//       const { bytes, signature: userSignature } = await txb.sign({
//         client: suiClient,
//         signer: ephemeralKeyPair,
//       });

//       if (!decodedJwt.sub || !decodedJwt.aud) {
//         throw new Error('Invalid JWT data');
//       }

//       // Generate address seed
//       const addressSeed = genAddressSeed(
//         BigInt(userSalt),
//         'sub',
//         decodedJwt.sub,
//         decodedJwt.aud as string
//       ).toString();

//       console.log('Address Seed:', addressSeed);
//       console.log('ZK Proof:', zkProof);

//       // Create zkLogin signature
//       const zkLoginSignature: SerializedSignature = getZkLoginSignature({
//         inputs: {
//           ...zkProof,
//           addressSeed,
//         },
//         maxEpoch,
//         userSignature,
//       });

//       console.log('ZK Login Signature:', zkLoginSignature);

//       // Execute the transaction
//       const executeRes = await suiClient.executeTransactionBlock({
//         transactionBlock: bytes,
//         signature: zkLoginSignature,
//       });

//       enqueueSnackbar('Transaction successful!', { variant: 'success' });
//       setExecuteDigest(executeRes.digest);

//     } catch (error) {
//       console.error('Transaction error:', error);
//       enqueueSnackbar(
//         error instanceof Error ? error.message : 'Transaction failed', 
//         { variant: 'error' }
//       );
//     } finally {
//       setExecutingTxn(false);
//     }
//   };

//   // Add email verification to Google sign-in
//   const handleGoogleSignIn = () => {
//     const params = new URLSearchParams({
//       client_id: CLIENT_ID,
//       redirect_uri: REDIRECT_URI,
//       response_type: "id_token",
//       scope: "openid email", // Add email to scope
//       nonce: nonce,
//     });
//     window.location.replace(
//       `https://accounts.google.com/o/oauth2/v2/auth?${params}`
//     );
//   };

//   // Create a ComingSoon component
//   const ComingSoonTab = ({ title }: { title: string }) => (
//     <div className="flex-1 flex flex-col items-center justify-center p-4">
//       <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-8 shadow-xl text-center max-w-md w-full">
//         <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
//           <FaCoins className="w-8 h-8 text-blue-400" />
//         </div>
//         <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
//         <p className="text-white/60">
//           This feature is coming soon. Stay tuned for updates!
//         </p>
//       </div>
//     </div>
//   );

//   const handleOpenReceiveModal = () => {
//     setOpenReceiveModal(true);
//   };

//   const handleCloseReceiveModal = () => {
//     setOpenReceiveModal(false);
//     setCopied(false);
//   };

//   const handleCopyAddress = () => {
//     if (zkLoginUserAddress) {
//       navigator.clipboard.writeText(zkLoginUserAddress);
//       setCopied(true);
//     }
//   };

//   if (!zkLoginUserAddress) {
//     return (
//       <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white antialiased">
//         {/* Header */}
//         <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-xl z-50 border-b border-white/5">
//           <div className="flex items-center gap-3">
//             <div className="relative group">
//               <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0066FF] via-purple-600 to-pink-500 rounded-full opacity-75 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200 animate-gradient"></div>
//               <div className="relative">
//                 <img 
//                   src={"https://xelene.me/telegram.gif"} 
//                   alt="" 
//                   className="w-10 h-10 rounded-full object-cover ring-2 ring-black/50"
//                 />
//               </div>
//             </div>
//             <span className="text-[15px] font-semibold text-white/50 leading-tight">
//               Anonymous
//             </span>
//           </div>
//         </div>

//         {/* Auth Content */}
//         <div className="flex-1 flex items-center justify-center p-4">
//           <div className="max-w-md w-full space-y-8 text-center">
//             <div className="space-y-3">
//               <h1 className="text-3xl font-bold tracking-tight text-white">
//                 Welcome to SUI Wallet
//               </h1>
//               <p className="text-white/60">
//                 Connect with Google to access your wallet and start transacting on the SUI network.
//               </p>
//             </div>

//             <div className="space-y-4">
//               <button 
//                 onClick={handleGoogleSignIn}
//                 disabled={!nonce}
//                 className="w-full bg-gradient-to-r from-[#0066FF] via-blue-500 to-blue-600 hover:from-[#0052cc] hover:via-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-3 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {!nonce ? (
//                   <div className="flex items-center gap-2">
//                     <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
//                       <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                       <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                     </svg>
//                     Initializing...
//                   </div>
//                 ) : (
//                   <>
//                     <img src={GoogleLogo} alt="Google" className="w-5 h-5" />
//                     Continue with Google
//                   </>
//                 )}
//               </button>

//               <div className="text-sm text-white/40">
//                 By continuing, you agree to our Terms of Service
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="flex flex-col min-h-screen bg-[#0A0A0F] text-white antialiased">
//       {/* Header */}
//       <div className="px-4 py-4 flex justify-between items-center sticky top-0 bg-[#0A0A0F]/90 backdrop-blur-xl z-50 border-b border-white/5">
//         {/* User Info and Actions */}
//         <div className="flex items-center gap-3">
//           {/* User Avatar and Address */}
//           <div className="relative group">
//             <img src={"https://xelene.me/telegram.gif"} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-black/50" />
//           </div>
//           <div className="flex flex-col">
//             {zkLoginUserAddress && (
//               <div className="flex items-center gap-2 bg-white/5 rounded-full px-3 py-1.5 hover:bg-white/10 transition-colors group">
//                 <span className="text-xs font-medium text-white/60">
//                   {zkLoginUserAddress.slice(0, 6)}...{zkLoginUserAddress.slice(-4)}
//                 </span>
//                 <button onClick={handleCopyAddress} className="text-blue-300 hover:text-blue-300 transition-colors ml-1" title="Copy address">
//                   {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//         {/* Reset and Logout Buttons */}
//         <div className="flex items-center gap-3">
//           {/* <button onClick={() => setShowResetDialog(true)} className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-full p-2 transition-all duration-200" title="Reset Wallet">
//           </button> */}
//           <button onClick={() => { resetLocalState(); enqueueSnackbar('Successfully logged out', { variant: 'success' }); }} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full p-2 transition-all duration-200" title="Logout">
//             <FiLogOut size={20} /> {/* Logout Icon */}
//           </button>
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 flex flex-col p-4 pb-20 space-y-5">
//         {activeTab === 'home' && (
//           <>
//             {/* Balance Card */}
//             <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5">
//               {/* Balance and Network Info */}
//               <div className="flex items-center justify-between mb-6">
//                 {/* Balance Info */}
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
//                     <FaCoins className="w-5 h-5 text-blue-400" />
//                   </div>
//                   <div>
//                     <span className="text-sm font-medium text-white/60">Total Balance</span>
//                     <div className="flex items-baseline gap-2">
//                       <span className="text-2xl font-bold text-white">
//                         {addressBalance ? BigNumber(addressBalance?.totalBalance).div(MIST_PER_SUI.toString()).toFixed(4) : '0.0000'}
//                       </span>
//                       <span className="text-sm font-medium text-white/60">SUI</span>
//                     </div>
//                   </div>
//                 </div>
//                 {/* Network Info */}
//                 <div className="flex flex-col items-end">
//                   <span className="text-xs font-medium text-white/40">Network</span>
//                   <span className="text-sm font-medium text-white/80">Devnet</span>
//                 </div>
//               </div>
//               {/* Action Buttons */}
//               <div className="grid grid-cols-2 gap-3">
//                 <button onClick={handleTransaction} disabled={executingTxn || !zkLoginUserAddress} className="bg-gradient-to-r from-[#0066FF] via-blue-500 to-blue-600 hover:from-[#0052cc] hover:via-blue-600 hover:to-blue-700 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
//                   {executingTxn ? (
//                     <>
//                       <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
//                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
//                       </svg>
//                       <span>Sending...</span>
//                     </>
//                   ) : (
//                     'Send SUI'
//                   )}
//                 </button>
//                 <button onClick={handleOpenReceiveModal} className="bg-white/5 hover:bg-white/10 text-white rounded-xl px-6 py-4 text-sm font-semibold tracking-wide transition-all duration-300 flex items-center justify-center gap-2">
//                   <RiMessage3Line className="w-4 h-4" />
//                   Receive
//                 </button>
//               </div>
//             </div>

//              {/* Earnings Card */}
//              <div className="bg-gradient-to-br from-[#1A1B1E] to-[#252730] rounded-[24px] p-6 shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/5">
//               <div className="flex justify-between items-center mb-4">
//                 <span className="text-gray-200">Earnings Available</span>
//                 <button
//                   className="bg-white text-black rounded-full px-6 py-2 text-sm font-medium hover:bg-white/90 transition-colors"
//                 >
//                   Withdraw
//                 </button>
//               </div>
//               <div className="flex flex-col">
//                 <span className="text-[48px] font-extrabold text-white tracking-tight">$0</span>
//                 <span className="text-[18px] font-medium text-white/60 mt-2">0 SUI</span>
//               </div>
              
//               <div className="mt-4">
//                 <div className="flex items-center gap-2">
//                   <span className="text-gray-400">Staking timeline</span>
//                   <AiOutlineInfoCircle className="text-gray-400" />
//                 </div>
//                 <div className="w-full h-1 bg-[#2a2a40] rounded-full mt-2">
//                   <div className="w-1/3 h-full bg-blue-500 rounded-full" />
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-around mt-6 bg-[#1A1B1E] rounded-[24px] p-4">
//               <button className="text-white font-medium hover:text-blue-400 transition-colors">Stats</button>
//               <button className="text-white font-medium hover:text-blue-400 transition-colors">Community</button>
//               <button className="text-white font-medium hover:text-blue-400 transition-colors">Activity</button>
//             </div>

//             {/* Receive Modal */}
//             <Dialog open={openReceiveModal} onClose={handleCloseReceiveModal} PaperProps={{
//               style: {
//                 background: 'linear-gradient(135deg, #1A1B1E, #252730)', // Professional gradient background
//                 borderRadius: '16px',
//                 padding: '20px',
//                 color: 'white',
//               }
//             }}>
//               <DialogTitle style={{ textAlign: 'center', fontWeight: 'bold', color: '#00BFFF' }}>Receive SUI</DialogTitle>
//               <DialogContent>
//                 <div className="flex flex-col space-y-4">
//                   {zkLoginUserAddress && (
//                     <>
//                       <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex justify-center">
//                         <QRCodeSVG value={zkLoginUserAddress} size={200} level="H" className="p-2 bg-white rounded-xl" />
//                       </div>
//                       <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
//                         <span className="text-sm text-white/60 block mb-2">Wallet Address</span>
//                         <div className="flex items-center gap-2 break-all">
//                           <span className="text-sm font-medium text-white/90">{zkLoginUserAddress}</span>
//                           <button onClick={handleCopyAddress} className="text-blue-400 hover:text-blue-300 transition-colors">
//                             {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
//                           </button>
//                         </div>
//                         {copied && <span className="text-xs text-green-400">Copied to clipboard!</span>}
//                       </div>
//                       <div className="flex items-center gap-2 bg-blue-500/5 rounded-xl p-3">
//                         <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                         </svg>
//                         <span className="text-sm text-blue-400">Only send SUI to this address</span>
//                       </div>
//                     </>
//                   )}
//                 </div>
//               </DialogContent>
//               <DialogActions>
//                 <Button onClick={handleCloseReceiveModal} style={{ color: '#0066FF' }}>
//                   Close
//                 </Button>
//               </DialogActions>
//             </Dialog>
//           </>
//         )}
//         {/* {activeTab === 'network' && <NetworkTab />}
//         {activeTab === 'gmp' && <GMPTab />}
//         {activeTab === 'support' && <SupportTab />}
//         {activeTab === 'token' && <TokenTab />} */}
//       </div>

//       {/* Bottom Navigation */}
//       <div className="fixed bottom-0 left-0 right-0 bg-[#1A1B1E]/90 backdrop-blur-xl border-t border-white/5 safe-area-pb z-50">
//         <div className="max-w-lg mx-auto px-2 md:px-4">
//           <div className="grid grid-cols-5 items-center">
//             {[
//               { id: 'home', text: 'Home', Icon: AiOutlineHome },
//               { id: 'network', text: 'Network', Icon: BiNetworkChart },
//               { id: 'gmp', text: 'GMP', Icon: FaCoins },
//               { id: 'support', text: 'Support', Icon: RiMessage3Line },
//               { id: 'token', text: 'Token', Icon: FaCoins }
//             ].map(({ id, text, Icon }) => (
//               <button key={id} onClick={() => setActiveTab(id)} className={`flex flex-col items-center py-3 md:py-4 w-full transition-all duration-300 relative group ${activeTab === id ? 'text-blue-400' : 'text-white/40 hover:text-white/60'}`}>
//                 <Icon size={18} className={`${activeTab === id ? 'transform scale-110 transition-transform duration-300' : 'group-hover:scale-110 transition-transform duration-300'}`} />
//                 <span className="text-[10px] md:text-xs font-medium mt-1 tracking-wide truncate max-w-[64px] text-center">{text}</span>
//                 {activeTab === id && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-blue-400" />}
//               </button>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Reset Dialog */}
//       <Dialog open={showResetDialog} onClose={() => setShowResetDialog(false)} className="fixed z-50 inset-0 overflow-y-auto">
//         <div className="bg-[#1A1B1E] p-6 rounded-2xl max-w-sm mx-auto">
//           <h3 className="text-lg font-medium text-white mb-2">Reset Wallet?</h3>
//           <p className="text-white/60 text-sm mb-4">This will clear all wallet data. Make sure you have backed up any important information.</p>
//           <div className="flex justify-end gap-3">
//             <button onClick={() => setShowResetDialog(false)} className="px-4 py-2 text-sm font-medium text-white/60 hover:text-white">Cancel</button>
//             <button onClick={() => { resetState(); setShowResetDialog(false); enqueueSnackbar('Wallet reset successful', { variant: 'success' }); }} className="px-4 py-2 text-sm font-medium bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20">Reset</button>
//           </div>
//         </div>
//       </Dialog>
//     </div>
//   );
// }

// export default App;
