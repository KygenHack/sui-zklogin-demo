import { useSuiClient, useSuiClientQuery } from "@mysten/dapp-kit";
import { TransactionBlock } from "@mysten/sui.js/transactions";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { useNetworkVariable } from "../networkConfig";

type CounterProps = {
  id: string;
  signAndExecuteTransactionBlock: (params: { transactionBlock: TransactionBlock }) => Promise<{ digest: string }>;
  isReady?: boolean;
  zkLoginUserAddress: string;
};

export function Counter({ id, signAndExecuteTransactionBlock, isReady = false, zkLoginUserAddress }: CounterProps) {
  const counterPackageId = useNetworkVariable("counterPackageId");
  const suiClient = useSuiClient();
  const { data, isPending, error, refetch } = useSuiClientQuery("getObject", {
    id,
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  const [waitingForTxn, setWaitingForTxn] = useState("");

  const executeMoveCall = async (method: "increment" | "reset") => {
    setWaitingForTxn(method);
    const tx = new TransactionBlock();
    tx.setSender(zkLoginUserAddress);

    if (method === "reset") {
      tx.moveCall({
        arguments: [tx.object(id), tx.pure.u64(0)],
        target: `${counterPackageId}::counter::set_value`,
      });
    } else {
      tx.moveCall({
        arguments: [tx.object(id)],
        target: `${counterPackageId}::counter::increment`,
      });
    }

    try {
      const result = await signAndExecuteTransactionBlock({ transactionBlock: tx });
      await suiClient.waitForTransaction({ digest: result.digest });
      await refetch();
    } finally {
      setWaitingForTxn("");
    }
  };

  if (isPending) return <p className="text-white/60">Loading...</p>;
  if (error) return <p className="text-red-400">Error: {error.message}</p>;
  if (!data.data) return <p className="text-white/60">Not found</p>;

  const ownedByCurrentAccount = getCounterFields(data.data)?.owner === zkLoginUserAddress;
  const currentValue = getCounterFields(data.data)?.value || 0;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#1A1B1E] to-[#252730] rounded-[32px] border border-white/10 shadow-xl">
      {/* Score Display */}
      <div className="text-center mb-8">
        <h2 className="text-white/60 text-sm mb-2">YOUR SCORE</h2>
        <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          {currentValue.toLocaleString()}
        </div>
      </div>

      {/* Main Click Button */}
      <button
        onClick={() => executeMoveCall("increment")}
        disabled={waitingForTxn !== "" || !isReady}
        className={`
          w-32 h-32 rounded-full 
          bg-gradient-to-b from-blue-500 to-blue-600
          hover:from-blue-400 hover:to-blue-500
          disabled:from-gray-500 disabled:to-gray-600
          shadow-lg shadow-blue-500/20
          transform transition-all duration-200
          ${waitingForTxn === "" ? 'hover:scale-105 active:scale-95' : 'animate-pulse'}
          flex items-center justify-center
          border-4 border-white/10
        `}
      >
        {waitingForTxn === "increment" ? (
          <ClipLoader color="#ffffff" size={40} />
        ) : (
          <span className="text-white text-xl font-bold">TAP</span>
        )}
      </button>

      {/* Reset Button (if owner) */}
      {ownedByCurrentAccount && (
        <button
          onClick={() => executeMoveCall("reset")}
          disabled={waitingForTxn !== "" || !isReady}
          className="mt-6 px-6 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 
                     rounded-full text-sm font-medium transition-colors
                     disabled:bg-gray-500/20 disabled:text-gray-400"
        >
          {waitingForTxn === "reset" ? <ClipLoader size={16} /> : "Reset Score"}
        </button>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 mt-8 w-full">
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs mb-1">RANK</p>
          <p className="text-white text-lg font-bold">#1</p>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <p className="text-white/60 text-xs mb-1">LEVEL</p>
          <p className="text-white text-lg font-bold">{Math.floor(Math.log10(currentValue + 1))}</p>
        </div>
      </div>
    </div>
  );
}

function getCounterFields(data: any) {
  if (data.content?.dataType !== "moveObject") {
    return null;
  }
  return data.content.fields as { value: number; owner: string };
}
  