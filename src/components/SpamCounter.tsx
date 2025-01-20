// import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
// import { TransactionBlock } from "@mysten/sui.js/transactions";
// import { useState } from "react";
// import ClipLoader from "react-spinners/ClipLoader";
// import { useNetworkVariable } from "../networkConfig";
// import { SpamCreateCounter } from "./SpamCreateCounter";

// type SpamCounterProps = {
//   directorId: string;
//   signAndExecuteTransactionBlock: (params: { transactionBlock: TransactionBlock }) => Promise<{ digest: string }>;
//   isReady?: boolean;
//   zkLoginUserAddress: string;
// };

// export function SpamCounter({ 
//   directorId, 
//   signAndExecuteTransactionBlock, 
//   isReady = false, 
//   zkLoginUserAddress 
// }: SpamCounterProps) {
//   const spamPackageId = useNetworkVariable("spamPackageId");
//   const suiClient = useSuiClient();
//   const [userCounterId, setUserCounterId] = useState<string | null>(() => {
//     return localStorage.getItem('spamCounterId');
//   });
//   const [waitingForTxn, setWaitingForTxn] = useState("");

//   // Query the user's counter if it exists
//   const { data: counterData, isPending: isCounterPending, error: counterError, refetch: refetchCounter } = 
//     useSuiClientQuery("getObject", {
//       id: userCounterId || "",
//       options: {
//         showContent: true,
//         showOwner: true,
//       }
//     }, {
//       enabled: !!userCounterId,
//     });

//   // Increment counter
//   const incrementCounter = async () => {
//     if (!userCounterId) return;
    
//     setWaitingForTxn("increment");
//     const tx = new TransactionBlock();
//     tx.setSender(zkLoginUserAddress);

//     tx.moveCall({
//       target: `${spamPackageId}::spam::increment_user_counter`,
//       arguments: [tx.object(userCounterId)],
//     });

//     try {
//       const result = await signAndExecuteTransactionBlock({ transactionBlock: tx });
//       await suiClient.waitForTransaction({ digest: result.digest });
//       await refetchCounter();
//     } catch (error) {
//       console.error('Transaction failed:', error);
//     } finally {
//       setWaitingForTxn("");
//     }
//   };

//   // Register counter
//   const registerCounter = async () => {
//     if (!userCounterId) return;
    
//     setWaitingForTxn("register");
//     const tx = new TransactionBlock();
//     tx.setSender(zkLoginUserAddress);

//     tx.moveCall({
//       target: `${spamPackageId}::spam::register_user_counter`,
//       arguments: [
//         tx.object(directorId),
//         tx.object(userCounterId),
//       ],
//     });

//     try {
//       const result = await signAndExecuteTransactionBlock({ transactionBlock: tx });
//       await suiClient.waitForTransaction({ digest: result.digest });
//       await refetchCounter();
//     } catch (error) {
//       console.error('Transaction failed:', error);
//     } finally {
//       setWaitingForTxn("");
//     }
//   };

//   if (!userCounterId) {
//     return (
//       <SpamCreateCounter
//         onCreated={setUserCounterId}
//         signAndExecuteTransactionBlock={signAndExecuteTransactionBlock}
//         isReady={isReady}
//         zkLoginUserAddress={zkLoginUserAddress}
//         directorId={directorId}
//       />
//     );
//   }

//   if (isCounterPending) return <p className="text-white/60">Loading...</p>;
//   if (counterError) return <p className="text-red-400">Error: {counterError.message}</p>;

//   const counterFields = getSpamCounterFields(counterData?.data);
//   const txCount = counterFields?.tx_count || 0;
//   const isRegistered = counterFields?.registered || false;

//   return (
//     <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1A1B1E] to-[#252730] rounded-[32px] border border-white/10 shadow-xl">
//       {/* Score Display */}
//       <div className="text-center mb-8">
//         <h2 className="text-white/60 text-sm mb-2">SPAM SCORE</h2>
//         <div className="text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
//           {txCount.toLocaleString()}
//         </div>
//       </div>

//       <button
//         onClick={incrementCounter}
//         disabled={waitingForTxn !== "" || !isReady || isRegistered}
//         className={`
//           w-32 h-32 rounded-full 
//           bg-gradient-to-b from-purple-500 to-purple-600
//           hover:from-purple-400 hover:to-purple-500
//           disabled:from-gray-500 disabled:to-gray-600
//           shadow-lg shadow-purple-500/20
//           transform transition-all duration-200
//           ${waitingForTxn === "" ? 'hover:scale-105 active:scale-95' : 'animate-pulse'}
//           flex items-center justify-center
//           border-4 border-white/10
//         `}
//       >
//         {waitingForTxn === "increment" ? (
//           <ClipLoader color="#ffffff" size={40} />
//         ) : (
//           <span className="text-white text-xl font-bold">SPAM</span>
//         )}
//       </button>

//       {!isRegistered && (
//         <button
//           onClick={registerCounter}
//           disabled={waitingForTxn !== "" || !isReady}
//           className="mt-4 px-6 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 
//                      rounded-full text-sm font-medium transition-colors
//                      disabled:bg-gray-500/20 disabled:text-gray-400"
//         >
//           {waitingForTxn === "register" ? (
//             <ClipLoader size={16} color="#60A5FA" />
//           ) : (
//             "Register Counter"
//           )}
//         </button>
//       )}
//     </div>
//   );
// }

// function getSpamCounterFields(data: any) {
//   if (data?.content?.dataType !== "moveObject") {
//     return null;
//   }
//   return data.content.fields as {
//     tx_count: number;
//     registered: boolean;
//     epoch: number;
//   };
// } 