import { useState } from "react";
import { useForm } from "react-hook-form";
import { HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Wish } from "@/lib/contracts";
import { describeWalletError, getSignerContracts } from "@/lib/contracts";
import { WISH_REGISTRY_ADDRESS } from "@/lib/arc-config";
import { parseUsdc } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

type DonatePanelProps = {
  wish: Wish;
  onConfirmed: () => Promise<void>;
};

type DonateForm = {
  amount: string;
};

export function DonatePanel({ wish, onConfirmed }: DonatePanelProps) {
  const wallet = useWallet();
  const { register, handleSubmit, reset } = useForm<DonateForm>({ defaultValues: { amount: "" } });
  const [status, setStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  async function onSubmit(values: DonateForm) {
    const connectedAddress = wallet.address ?? (await wallet.connect());
    if (!connectedAddress) {
      return;
    }

    setIsBusy(true);
    setStatus(undefined);
    try {
      const amount = parseUsdc(values.amount);
      if (amount <= 0n) throw new Error("Enter a USDC amount greater than zero.");
      const signer = await wallet.signer();
      const { registry, usdc } = await getSignerContracts(signer);
      const signerAddress = await signer.getAddress();
      const allowance = await usdc.allowance(signerAddress, WISH_REGISTRY_ADDRESS);

      if (allowance < amount) {
        setStatus("Approve USDC in your wallet first.");
        const approveTx = await usdc.approve(WISH_REGISTRY_ADDRESS, amount);
        await approveTx.wait();
      }

      setStatus("Donation submitted. Waiting for Arc confirmation.");
      const tx = await registry.donate(wish.id, amount);
      await tx.wait();
      reset();
      setStatus("Donation confirmed. This wish grew.");
      await wallet.refreshBalance();
      await onConfirmed();
    } catch (error) {
      setStatus(describeWalletError(error, "Donation failed. Check the amount and try again."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border border-vine/30 bg-[linear-gradient(180deg,#F8F9F3,#EDF1E9)] p-5 shadow-plate transition-colors duration-200 hover:border-vine">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-moss">Help it grow</h2>
          <p className="mt-1 text-sm leading-6 text-moss/70">Give USDC directly to the recipient.</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-vine/30 bg-paper text-vine">
          <HeartHandshake className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="donate-amount">Amount</Label>
        <Input id="donate-amount" inputMode="decimal" placeholder="25.00" {...register("amount", { required: true })} />
      </div>
      <Button type="submit" variant="vine" disabled={isBusy || wallet.isConnecting || wish.closed}>
        <HeartHandshake className="h-4 w-4" aria-hidden="true" />
        {wish.closed ? "Closed to new donations" : isBusy || wallet.isConnecting ? "Working" : "Help it grow"}
      </Button>
      {status ? <p className="rounded-md border border-vine/20 bg-paper px-3 py-2 text-sm leading-6 text-moss/75">{status}</p> : null}
    </form>
  );
}
