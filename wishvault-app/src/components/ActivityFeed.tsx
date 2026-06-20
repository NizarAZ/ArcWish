import { ExternalLink, Leaf, Sprout } from "lucide-react";
import { motion } from "framer-motion";
import { IllustratedEmptyState } from "@/components/IllustratedEmptyState";
import type { ActivityItem, Wish } from "@/lib/contracts";
import { formatUsdc, specimenNumber, truncateAddress, txUrl } from "@/lib/format";

type ActivityFeedProps = {
  activity: ActivityItem[];
  wishes: Wish[];
  limit?: number;
  compactEmpty?: boolean;
};

export function ActivityFeed({ activity, wishes, limit, compactEmpty = false }: ActivityFeedProps) {
  const shown = typeof limit === "number" ? activity.slice(0, limit) : activity;

  if (shown.length === 0) {
    if (compactEmpty) {
      return (
        <div className="rounded-md border border-vine/20 bg-glasshouse p-4">
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-vine/30 bg-paper text-vine">
              <Leaf className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg font-medium leading-tight text-moss">No activity yet</p>
              <p className="mt-1 text-sm leading-6 text-moss/70">This specimen has no ledger entries beyond its current on-chain state.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <IllustratedEmptyState
        title="No activity yet - plant the first specimen."
        text="The watering log will collect planted wishes, gifts, and funds as they happen on Arc."
        actionLabel="Register a specimen"
        actionTo="/create"
        progress={48}
      />
    );
  }

  return (
    <div className="grid gap-3">
      {shown.map((item, index) => {
        const wish = wishes.find((candidate) => candidate.id === item.wishId);
        return (
          <motion.article
            key={`${item.txHash}-${item.logIndex}-${item.kind}-${item.wishId.toString()}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: index * 0.04 }}
            className="group grid grid-cols-[40px_1fr] gap-3 rounded-lg border border-moss/15 bg-paper p-4 transition-all duration-200 hover:border-vine/45 hover:bg-glasshouse hover:shadow-plate"
          >
            <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-vine/35 bg-glasshouse transition-colors group-hover:border-clay/45 group-hover:bg-paper">
              {item.kind === "Donated" ? (
                <Leaf className="h-4 w-4 text-vine" aria-hidden="true" />
              ) : (
                <Sprout className="h-4 w-4 text-clay" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-moss">
                <strong className="font-semibold">{labelFor(item)}</strong>
                {item.amount ? <span className="font-mono text-vine mono-tabular">{formatUsdc(item.amount)} USDC</span> : null}
                <span className="text-moss/65">{item.detail}</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs text-moss/60">
                <span>{specimenNumber(item.wishId)}</span>
                <span>{wish?.title || "Unknown wish"}</span>
                {item.actor ? <span>{truncateAddress(item.actor)}</span> : null}
                <a
                  className="inline-flex items-center gap-1 text-vine underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                  href={txUrl(item.txHash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Arcscan
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </motion.article>
        );
      })}
    </div>
  );
}

function labelFor(item: ActivityItem) {
  if (item.kind === "WishCreated") return "Planted";
  if (item.kind === "Donated") return "Watered";
  if (item.kind === "Withdrawn") return "Collected";
  return "Closed";
}
