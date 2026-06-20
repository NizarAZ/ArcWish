import { useState } from "react";
import { useForm } from "react-hook-form";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Wish } from "@/lib/contracts";
import { describeWalletError, getSignerContracts } from "@/lib/contracts";
import { formatUsdc, parseUsdc } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

type WithdrawPanelProps = {
  wish: Wish;
  onConfirmed: () => Promise<void>;
};

type WithdrawForm = {
  amount: string;
};

export function WithdrawPanel({ wish, onConfirmed }: WithdrawPanelProps) {
  const wallet = useWallet();
  const { register, handleSubmit, setValue } = useForm<WithdrawForm>({ defaultValues: { amount: "" } });
  const [status, setStatus] = useState<string>();
  const [isBusy, setIsBusy] = useState(false);

  async function onSubmit(values: WithdrawForm) {
    setIsBusy(true);
    setStatus(undefined);
    try {
      const amount = parseUsdc(values.amount);
      if (amount <= 0n) throw new Error("Enter a USDC amount greater than zero.");
      const signer = await wallet.signer();
      const { registry } = await getSignerContracts(signer);
      setStatus("Collect request submitted. Waiting for Arc confirmation.");
      const tx = await registry.withdraw(wish.id, amount);
      await tx.wait();
      setValue("amount", "");
      setStatus("Funds collected.");
      await wallet.refreshBalance();
      await onConfirmed();
    } catch (error) {
      setStatus(describeWalletError(error, "Collect funds failed. Check the amount and try again."));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 rounded-lg border border-clay/30 bg-paper p-5 shadow-plate transition-colors duration-200 hover:border-clay">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-medium text-moss">Collect funds</h2>
          <p className="mt-1 text-sm leading-6 text-moss/70">Available now: {formatUsdc(wish.balance)} USDC.</p>
        </div>
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-clay/30 bg-glasshouse text-clay">
          <HandCoins className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <div className="grid gap-2">
        <Label htmlFor={`withdraw-${wish.id.toString()}`}>Amount</Label>
        <Input id={`withdraw-${wish.id.toString()}`} inputMode="decimal" placeholder={formatUsdc(wish.balance)} {...register("amount", { required: true })} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="secondary" onClick={() => setValue("amount", formatUsdc(wish.balance, 6))}>
          Use full balance
        </Button>
        <Button type="submit" disabled={isBusy || wish.balance === 0n}>
          <HandCoins className="h-4 w-4" aria-hidden="true" />
          {isBusy ? "Working" : "Collect funds"}
        </Button>
      </div>
      {status ? <p className="rounded-md border border-clay/20 bg-glasshouse px-3 py-2 text-sm leading-6 text-moss/75">{status}</p> : null}
    </form>
  );
}
