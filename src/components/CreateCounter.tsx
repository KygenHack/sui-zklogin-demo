import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import ClipLoader from "react-spinners/ClipLoader";
import { useState } from "react";

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

      setIsSuccess(true);
      onCreated(effects?.created?.[0]?.reference?.objectId!);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="container mx-auto px-4">
      <button
        className={`
          px-6 py-3 rounded-lg text-sm font-semibold
          ${isSuccess || isPending || !isReady
            ? 'bg-gray-500 cursor-not-allowed' 
            : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'}
          text-white transition-colors duration-200
        `}
        onClick={() => create()}
        disabled={isSuccess || isPending || !isReady}
      >
        {isSuccess || isPending ? (
          <ClipLoader size={20} color="white" />
        ) : !isReady ? (
          "Initializing..."
        ) : (
          "Create Counter"
        )}
      </button>
    </div>
  );
}