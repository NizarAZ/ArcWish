import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wish } from "@/lib/contracts";
import { describeWalletError, getSignerContracts } from "@/lib/contracts";
import { useWallet } from "@/lib/wallet-context";

type DeleteWishActionProps = {
  wish: Wish;
  onConfirmed: () => Promise<void>;
  compact?: boolean;
};

export function DeleteWishAction({ wish, onConfirmed, compact = false }: DeleteWishActionProps) {
  const wallet = useWallet();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [status, setStatus] = useState<string>();

  async function deleteWish() {
    const connectedAddress = wallet.address ?? (await wallet.connect());
    if (!connectedAddress) {
      return;
    }

    setIsBusy(true);
    setStatus(undefined);
    try {
      const signer = await wallet.signer();
      const { registry } = await getSignerContracts(signer);
      setStatus("Delete request submitted. Waiting for Arc confirmation.");
      const tx = await registry.closeWish(wish.id);
      await tx.wait();
      setIsConfirming(false);
      setStatus("Wish deleted from new donations.");
      await onConfirmed();
    } catch (error) {
      setStatus(describeWalletError(error, "Delete wish failed. Only the creator can delete this wish."));
    } finally {
      setIsBusy(false);
    }
  }

  if (wish.closed) {
    return compact ? <p className="font-mono text-xs text-moss/55">Deleted from new donations.</p> : null;
  }

  return (
    <div className={`grid gap-2 ${compact ? "" : "rounded-lg border border-red-700/25 bg-paper p-4 shadow-plate"}`}>
      {isConfirming ? (
        <div className="grid gap-3">
          <p className="text-sm leading-6 text-moss/75">
            This closes the wish to future donations. The on-chain record and history remain visible.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              disabled={isBusy || wallet.isConnecting}
              className="border-red-700 bg-red-700 text-paper hover:bg-red-800"
              onClick={() => void deleteWish()}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {isBusy || wallet.isConnecting ? "Deleting" : "Confirm delete"}
            </Button>
            <Button type="button" variant="quiet" disabled={isBusy || wallet.isConnecting} onClick={() => setIsConfirming(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="quiet"
          className="border-red-700/40 text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-paper"
          disabled={wallet.isConnecting}
          onClick={() => setIsConfirming(true)}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Delete wish
        </Button>
      )}
      {status ? <p className="rounded-md border border-red-700/20 bg-glasshouse px-3 py-2 text-sm leading-6 text-moss/75">{status}</p> : null}
    </div>
  );
}
