import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus, Search, Sprout, X } from "lucide-react";
import { ActivityFeed } from "@/components/ActivityFeed";
import { IllustratedEmptyState } from "@/components/IllustratedEmptyState";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { WishCard } from "@/components/WishCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ActivityItem, Wish } from "@/lib/contracts";
import { hasRegistryAddress } from "@/lib/contracts";
import { formatUsdc } from "@/lib/format";
import { cn } from "@/lib/utils";

type ExploreProps = {
  wishes: Wish[];
  activityWishes: Wish[];
  activity: ActivityItem[];
  isLoading: boolean;
};

export function Explore({ wishes, activityWishes, activity, isLoading }: ExploreProps) {
  const [walletSearch, setWalletSearch] = useState("");
  const [wishFilter, setWishFilter] = useState<"open" | "closed">("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const normalizedWalletSearch = walletSearch.trim().toLowerCase();
  const statusFilteredWishes = wishes.filter((wish) => (wishFilter === "open" ? !wish.closed : wish.closed));
  const filteredWishes = normalizedWalletSearch
    ? statusFilteredWishes.filter((wish) => wish.creator.toLowerCase().includes(normalizedWalletSearch) || wish.recipient.toLowerCase().includes(normalizedWalletSearch))
    : statusFilteredWishes;
  const openWishCount = wishes.filter((wish) => !wish.closed).length;
  const closedWishCount = wishes.filter((wish) => wish.closed).length;
  const featuredWish = wishes[0];
  const featuredGoal = featuredWish?.goal ?? 0n;
  const featuredRaised = featuredWish?.totalRaised ?? 0n;
  const featuredProgress = featuredWish ? (featuredGoal > 0n ? Number((featuredRaised * 100n) / featuredGoal) : 64) : 0;
  const featuredGoalLabel = featuredGoal > 0n ? formatUsdc(featuredGoal) : "open goal";
  const showEmptyState = !isLoading && wishes.length === 0;
  const showFilteredEmptyState = !isLoading && wishes.length > 0 && filteredWishes.length === 0;

  return (
    <section className="grid gap-10 py-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-stretch">
        <div className="grid content-end gap-4 rounded-lg border border-vine/20 bg-paper p-6 shadow-plate">
          <span className="inline-flex w-fit items-center gap-2 rounded-md border border-vine/25 bg-glasshouse px-3 py-1 font-mono text-xs text-vine">
            <Sprout className="h-3.5 w-3.5" aria-hidden="true" />
            living catalog
          </span>
          <h2 className="max-w-3xl font-display text-4xl font-medium leading-tight text-moss sm:text-5xl">A living catalog of wishes</h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-moss/75">
            Plant a wish with a USDC goal, help someone else grow theirs, or collect funds from your own specimen.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/create">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Register a specimen
              </Link>
            </Button>
            <Button asChild variant="vine">
              <Link to="/activity">View watering log</Link>
            </Button>
          </div>
        </div>
        <div className="relative min-h-72 overflow-hidden rounded-lg border border-moss/20 bg-glasshouse p-5 shadow-plate">
          <div className="absolute right-4 top-4 rounded-md bg-clay px-2 py-1 font-mono text-xs text-paper">{featuredWish ? `No. ${featuredWish.id.toString().padStart(3, "0")}` : "No. 000"}</div>
          <SpecimenGrowth progress={featuredProgress} size="sm" wishKey={`explore-hero-${featuredWish?.id.toString() ?? "empty"}`} className="mx-auto h-64 max-w-[260px]" />
          <div className="absolute bottom-4 left-4 right-4 rounded-md border border-vine/20 bg-paper/90 p-3">
            <p className="font-display text-lg font-medium text-moss">Raised so far</p>
            <p className="font-mono text-sm text-vine mono-tabular">{formatUsdc(featuredRaised)} / {featuredGoalLabel} USDC</p>
          </div>
        </div>
      </div>

      {showEmptyState ? (
        <IllustratedEmptyState
          title="No specimens yet - plant the first one."
          text={hasRegistryAddress() ? "The live catalog has zero wishes right now." : "WishRegistry is not configured yet."}
          actionLabel="Plant the first one"
          actionTo="/create"
          progress={0}
        />
      ) : null}

      {!showEmptyState ? (
        <div className="grid gap-3 rounded-lg border border-vine/20 bg-paper p-4 shadow-plate lg:grid-cols-[minmax(0,1fr)_220px_auto] lg:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-vine" aria-hidden="true" />
            <Input
              value={walletSearch}
              onChange={(event) => setWalletSearch(event.target.value)}
              className="pl-10 pr-10 font-mono"
              placeholder="Search by creator or recipient wallet address"
              aria-label="Search wishes by wallet address"
            />
            {walletSearch ? (
              <button
                type="button"
                className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-moss/55 transition-colors hover:bg-glasshouse hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                aria-label="Clear wallet search"
                onClick={() => setWalletSearch("")}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <div className="relative">
            <button
              type="button"
              className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-moss/25 bg-glasshouse px-3 py-2 text-left text-sm font-semibold text-moss transition-colors hover:border-vine hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
              aria-haspopup="listbox"
              aria-expanded={filterOpen}
              onClick={() => setFilterOpen((open) => !open)}
            >
              <span>{wishFilter === "open" ? "Open wishes" : "Closed wishes"}</span>
              <ChevronDown className={cn("h-4 w-4 text-vine transition-transform duration-200", filterOpen ? "rotate-180" : "")} aria-hidden="true" />
            </button>
            <AnimatePresence>
              {filterOpen ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.16 }}
                  className="absolute right-0 z-20 mt-2 grid w-full gap-1 rounded-md border border-moss/20 bg-paper p-1 shadow-plate"
                  role="listbox"
                >
                  {([
                    ["open", `Open wishes (${openWishCount})`],
                    ["closed", `Closed wishes (${closedWishCount})`]
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      role="option"
                      aria-selected={wishFilter === value}
                      className={cn(
                        "flex min-h-9 cursor-pointer items-center justify-between rounded-sm px-3 text-sm text-moss transition-colors hover:bg-glasshouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard",
                        wishFilter === value ? "bg-glasshouse font-semibold text-vine" : ""
                      )}
                      onClick={() => {
                        setWishFilter(value);
                        setFilterOpen(false);
                      }}
                    >
                      {label}
                      {wishFilter === value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <p className="font-mono text-xs text-moss/65">
            {normalizedWalletSearch ? `${filteredWishes.length} matching specimens` : `${filteredWishes.length} ${wishFilter} specimens`}
          </p>
        </div>
      ) : null}

      {showFilteredEmptyState ? (
        <IllustratedEmptyState
          title={normalizedWalletSearch ? "No wishes for that wallet." : wishFilter === "open" ? "No open wishes." : "No closed wishes."}
          text={normalizedWalletSearch ? "Try the other wish status or paste a full creator or recipient address." : wishFilter === "open" ? "Closed specimens can still be reviewed from the filter." : "Deleted wishes will appear here after creators close them."}
          progress={wishFilter === "open" ? 22 : 8}
        />
      ) : null}

      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      >
        {filteredWishes.map((wish, index) => (
          <WishCard key={`${wish.id.toString()}-${index}`} wish={wish} index={index} />
        ))}
      </motion.div>

      <section className="grid gap-4">
        <div>
          <h3 className="font-display text-2xl font-medium text-moss">Recent activity</h3>
          <p className="mt-1 text-sm text-moss/70">Every planted, watered, and collected wish is linked to Arcscan.</p>
        </div>
        <ActivityFeed activity={activity} wishes={activityWishes} limit={5} />
      </section>
    </section>
  );
}
