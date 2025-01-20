// import { TransactionBlock } from "@mysten/sui.js/transactions";
// import { useSuiClient } from "@mysten/dapp-kit";
// import { useNetworkVariable } from "../networkConfig";
// import ClipLoader from "react-spinners/ClipLoader";
// import { useState, useEffect } from "react";

// type SpamCreateCounterProps = {
//   onCreated: (id: string) => void;
//   signAndExecuteTransactionBlock: (params: { transactionBlock: TransactionBlock }) => Promise<{ digest: string }>;
//   isReady?: boolean;
//   zkLoginUserAddress: string;
//   directorId: string;
// };

// export function SpamCreateCounter({
//   onCreated,
//   signAndExecuteTransactionBlock,
//   isReady = false,
//   zkLoginUserAddress,
//   directorId
// }: SpamCreateCounterProps) {
//   const spamPackageId = useNetworkVariable("spamPackageId");
//   const suiClient = useSuiClient();
//   const [isPending, setIsPending] = useState(false);
//   const [isSuccess, setIsSuccess] = useState(false);

//   useEffect(() => {
//     const storedSpamCounterId = localStorage.getItem('spamCounterId');
    
//     if (isReady && !storedSpamCounterId && !isSuccess && !isPending) {
//       create();
//     } else if (storedSpamCounterId) {
//       setIsSuccess(true);
//       onCreated(storedSpamCounterId);
//     }
//   }, [isReady, isSuccess, isPending, onCreated]);

//   async function create() {
//     if (!directorId) {
//       console.error('Director ID is not defined');
//       return;
//     }

//     setIsPending(true);
//     try {
//       const tx = new TransactionBlock();
//       tx.moveCall({
//         target: `${spamPackageId}::spam::new_user_counter`,
//         arguments: [tx.object(directorId)],
//       });
//       tx.setSender(zkLoginUserAddress);

//       const result = await signAndExecuteTransactionBlock({
//         transactionBlock: tx,
//       });

//       const { effects } = await suiClient.waitForTransaction({
//         digest: result.digest,
//         options: {
//           showEffects: true,
//         },
//       });

//       const spamCounterId = effects?.created?.[0]?.reference?.objectId;
      
//       if (!spamCounterId) {
//         throw new Error('Failed to create spam counter: No object ID returned');
//       }

//       localStorage.setItem('spamCounterId', spamCounterId);
//       setIsSuccess(true);
//       onCreated(spamCounterId);
//     } catch (e) {
//       console.error('Error creating spam counter:', e);
//       setIsSuccess(false);
//     } finally {
//       setIsPending(false);
//     }
//   }

//   return (
//     <div className="container mx-auto px-4">
//       {isPending && (
//         <div className="flex items-center justify-center">
//           <ClipLoader size={20} color="white" />
//           <span className="ml-2 text-white/60">Creating SPAM counter...</span>
//         </div>
//       )}
//     </div>
//   );
// } 