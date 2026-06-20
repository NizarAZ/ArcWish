import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, HandCoins, Leaf, Sprout } from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { DeleteWishAction } from "@/components/DeleteWishAction";
import { DonatePanel } from "@/components/DonatePanel";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { WithdrawPanel } from "@/components/WithdrawPanel";
import { WishImage } from "@/components/WishImage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { ActivityItem, Wish } from "@/lib/contracts";
import { addressUrl } from "@/lib/format";
import { formatUsdc, neededAmount, percentRaised, specimenNumber, truncateAddress } from "@/lib/format";
import { useWallet } from "@/lib/wallet-context";

type WishDetailProps = {
  wishes: Wish[];
  activity: ActivityItem[];
  onConfirmed: () => Promise<void>;
};

export function WishDetail({ wishes, activity, onConfirmed }: WishDetailProps) {
  const params = useParams();
  const wallet = useWallet();
  const wish = wishes.find((candidate) => candidate.id.toString() === params.id);

  if (!wish) {
    return (
      <section className="grid gap-4 py-6">
        <Button asChild variant="secondary" className="w-fit">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to catalog
          </Link>
        </Button>
        <div className="rounded-lg border border-moss/20 bg-paper p-5 text-sm text-moss/70">That specimen was not found.</div>
      </section>
    );
  }

  const progress = percentRaised(wish.totalRaised, wish.goal);
  const isCreator = wallet.address?.toLowerCase() === wish.creator.toLowerCase();
  const isRecipient = wallet.address?.toLowerCase() === wish.recipient.toLowerCase();
  const wishActivity = activity.filter((item) => item.wishId === wish.id);
  const stage = specimenStage(progress, wish.balance, wish.closed);
  const stillNeeded = wish.goal > 0n ? neededAmount(wish.totalRaised, wish.goal) : 0n;

  return (
    <section className="grid gap-5 py-6">
      <Button asChild variant="ghost" className="w-fit">
        <Link to="/">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to catalog
        </Link>
      </Button>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_370px]">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <Card className={`relative min-h-[760px] overflow-hidden border-vine/25 p-0 shadow-plate ${stage.frameClass}`}>
            <div className="absolute inset-0 opacity-70" aria-hidden="true">
              <div className="absolute left-1/2 top-24 h-[520px] w-[520px] -translate-x-1/2 rounded-full border border-vine/15" />
              <div className="absolute left-1/2 top-36 h-[420px] w-[420px] -translate-x-1/2 rounded-full border border-moss/10" />
              <div className={`absolute inset-x-8 bottom-20 h-px ${stage.ruleClass}`} />
            </div>

            <div className="relative z-10 grid min-h-[760px] grid-rows-[auto_1fr_auto] gap-4 p-5 sm:p-7">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-xl">
                  <p className="font-mono text-sm text-vine">{specimenNumber(wish.id)}</p>
                  <h2 className="mt-2 font-display text-4xl font-medium leading-tight text-moss sm:text-5xl">{wish.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-moss/75 sm:text-base">{wish.description}</p>
                </div>
                <div className={`w-fit rounded-md border px-3 py-2 font-mono text-xs ${stage.badgeClass}`}>{stage.label}</div>
              </div>

              <div className="relative grid min-h-[520px] place-items-center">
                <MetricPin className="left-0 top-6 sm:left-2" label="Raised so far" value={`${formatUsdc(wish.totalRaised)} USDC`} icon="leaf" />
                <MetricPin className="right-0 top-24 sm:right-4" label={wish.goal > 0n ? "Still needed" : "Goal"} value={wish.goal > 0n ? `${formatUsdc(stillNeeded)} USDC` : "Open"} icon="sprout" />
                <MetricPin className="bottom-12 right-1 sm:right-10" label="Collectable" value={`${formatUsdc(wish.balance)} USDC`} icon="coins" accent={wish.balance > 0n} />
                <SpecimenGrowth
                  progress={progress}
                  size="lg"
                  wishKey={wish.id.toString()}
                  className="h-[650px] max-w-[650px] drop-shadow-[0_18px_30px_rgba(43,58,44,0.14)]"
                />
              </div>

              <div className="grid gap-2 border-t border-moss/10 pt-4 font-mono text-xs text-moss/65 sm:grid-cols-2">
                <span>Creator: {truncateAddress(wish.creator)}</span>
                <a className="inline-flex w-fit items-center gap-1 text-vine underline-offset-4 transition-colors hover:text-clay hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard" href={addressUrl(wish.recipient)} target="_blank" rel="noreferrer">
                  Recipient: {truncateAddress(wish.recipient)}
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </Card>

          <section className="grid content-start gap-4 rounded-lg border border-moss/15 bg-paper/95 p-4 shadow-plate lg:sticky lg:top-4">
            <div className="flex items-start justify-between gap-3 border-b border-moss/10 pb-3">
              <div>
                <h3 className="font-display text-2xl font-medium text-moss">Specimen ledger</h3>
                <p className="mt-1 text-sm leading-6 text-moss/70">Pinned history for this wish.</p>
              </div>
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-vine/30 bg-glasshouse text-vine">
                <Leaf className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <ActivityFeed activity={wishActivity} wishes={wishes} compactEmpty />
          </section>
        </div>

        <aside className="grid content-start gap-4 xl:sticky xl:top-4">
          <div className="overflow-hidden rounded-lg border border-vine/20 bg-paper shadow-plate">
            <div className="relative aspect-[4/3] bg-glasshouse">
              <WishImage
                imageURI={wish.imageURI}
                alt=""
                className="h-full w-full object-cover"
                fallback={
                  <div className="absolute inset-x-10 bottom-0 top-4">
                    <SpecimenGrowth progress={Math.max(35, progress)} size="sm" wishKey={`detail-image-${wish.id.toString()}`} />
                  </div>
                }
              />
              <span className="absolute left-3 top-3 rounded-sm border border-moss/25 bg-paper/95 px-2 py-1 font-mono text-xs text-moss shadow-sm">
                {specimenNumber(wish.id)}
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-vine/20 bg-paper p-4 shadow-plate">
            <p className="font-display text-2xl font-medium text-moss">Next tending</p>
            <p className="mt-2 text-sm leading-6 text-moss/70">
              Help this specimen grow, or collect available funds if you are the recipient.
            </p>
          </div>
          <DonatePanel wish={wish} onConfirmed={onConfirmed} />
          {isRecipient ? <WithdrawPanel wish={wish} onConfirmed={onConfirmed} /> : null}
          {isCreator ? <DeleteWishAction wish={wish} onConfirmed={onConfirmed} /> : null}
        </aside>
      </div>
    </section>
  );
}

function MetricPin({ label, value, icon, accent = false, className = "" }: { label: string; value: string; icon: "leaf" | "sprout" | "coins"; accent?: boolean; className?: string }) {
  const Icon = icon === "leaf" ? Leaf : icon === "sprout" ? Sprout : HandCoins;
  return (
    <div className={`absolute z-20 max-w-[210px] rounded-md border bg-paper/95 px-3 py-2 shadow-plate transition-colors duration-200 hover:border-vine hover:bg-glasshouse ${accent ? "border-clay/35" : "border-vine/25"} ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${accent ? "text-clay" : "text-vine"}`} aria-hidden="true" />
        <p className="text-xs font-semibold text-moss/65">{label}</p>
      </div>
      <p className={`mt-1 font-mono text-sm mono-tabular ${accent ? "text-clay" : "text-moss"}`}>{value}</p>
    </div>
  );
}

function specimenStage(progress: number, balance: bigint, closed: boolean) {
  if (closed) {
    return {
      label: "Closed",
      frameClass: "bg-[linear-gradient(180deg,#F8F9F3,#EDF1E9)]",
      badgeClass: "border-red-700/30 bg-paper text-red-700",
      ruleClass: "bg-red-700/20"
    };
  }
  if (progress >= 100) {
    return {
      label: balance > 0n ? "Bloomed - funds available" : "Bloomed - collected",
      frameClass: "bg-[radial-gradient(circle_at_50%_44%,rgba(181,86,46,0.16),transparent_28%),radial-gradient(circle_at_50%_52%,rgba(217,165,61,0.16),transparent_38%),#F8F9F3]",
      badgeClass: "border-clay/35 bg-paper text-clay",
      ruleClass: "bg-clay/25"
    };
  }
  if (progress >= 75) {
    return {
      label: "Budding",
      frameClass: "bg-[radial-gradient(circle_at_50%_44%,rgba(217,165,61,0.16),transparent_34%),linear-gradient(180deg,#F8F9F3,#EDF1E9)]",
      badgeClass: "border-mustard/40 bg-paper text-moss",
      ruleClass: "bg-mustard/30"
    };
  }
  if (progress > 0) {
    return {
      label: "Growing",
      frameClass: "bg-[radial-gradient(circle_at_50%_48%,rgba(91,140,90,0.14),transparent_40%),#F8F9F3]",
      badgeClass: "border-vine/35 bg-glasshouse text-vine",
      ruleClass: "bg-vine/25"
    };
  }
  return {
    label: "Seedling",
    frameClass: "bg-[linear-gradient(180deg,#F8F9F3,#EDF1E9)]",
    badgeClass: "border-moss/20 bg-paper text-moss/70",
    ruleClass: "bg-moss/15"
  };
}
