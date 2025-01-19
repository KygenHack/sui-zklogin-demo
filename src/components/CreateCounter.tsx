import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState, useEffect } from "react";

type CreateCounterProps = {
  onCreated: (id: string) => void;
  signAndExecuteTransactionBlock: (params: { transactionBlock: TransactionBlock }) => Promise<{ digest: string }>;
  isReady?: boolean;
  zkLoginUserAddress: string;
};

export function CreateCounter({
  onCreated,
  signAndExecuteTransactionBlock,
  isReady = false,
  zkLoginUserAddress
}: CreateCounterProps) {
  const counterPackageId = useNetworkVariable("counterPackageId");
  const suiClient = useSuiClient();
  const [isPending, setIsPending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const storedCounterId = localStorage.getItem('counterId');
    
    if (isReady && !storedCounterId && !isSuccess && !isPending) {
      create();
    } else if (storedCounterId) {
      setIsSuccess(true);
      onCreated(storedCounterId);
    }
  }, [isReady]);

  async function create() {
    setIsPending(true);
    try {
      const tx = new TransactionBlock();
      tx.moveCall({
        arguments: [],
        target: `${counterPackageId}::counter::create`,
      });
      tx.setSender(zkLoginUserAddress);

      const result = await signAndExecuteTransactionBlock({
        transactionBlock: tx,
      });

      const { effects } = await suiClient.waitForTransaction({
        digest: result.digest,
        options: {
          showEffects: true,
        },
      });

      const counterId = effects?.created?.[0]?.reference?.objectId!;
      
      localStorage.setItem('counterId', counterId);
      
      setIsSuccess(true);
      onCreated(counterId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4">
      {isPending && (
        <div className="flex items-center justify-center">
          <ClipLoader size={20} color="white" />
          <span className="ml-2 text-white/60">Creating counter...</span>
        </div>
      )}
    </div>
  );
}