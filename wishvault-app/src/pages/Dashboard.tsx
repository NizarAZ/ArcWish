import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Plus, WalletCards } from "lucide-react";
import { IllustratedEmptyState } from "@/components/IllustratedEmptyState";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { DeleteWishAction } from "@/components/DeleteWishAction";
import { WishCard } from "@/components/WishCard";
import { WithdrawPanel } from "@/components/WithdrawPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ActivityItem, Wish } from "@/lib/contracts";
import { cn } from "@/lib/utils";
import { useWallet } from "@/lib/wallet-context";

type DashboardProps = {
  wishes: Wish[];
  activity: ActivityItem[];
  onConfirmed: () => Promise<void>;
};

export function Dashboard({ wishes, activity, onConfirmed }: DashboardProps) {
  const wallet = useWallet();
  const [plantedFilter, setPlantedFilter] = useState<"open" | "closed">("open");
  const [filterOpen, setFilterOpen] = useState(false);
  const address = wallet.address?.toLowerCase();
  const planted = address ? wishes.filter((wish) => wish.creator.toLowerCase() === address) : [];
  const filteredPlanted = planted.filter((wish) => (plantedFilter === "open" ? !wish.closed : wish.closed));
  const wateredIds = new Set(activity.filter((item) => item.kind === "Donated" && item.actor.toLowerCase() === address).map((item) => item.wishId.toString()));
  const watered = wishes.filter((wish) => wateredIds.has(wish.id.toString()));
  const hasWallet = Boolean(wallet.address);
  const openPlantedCount = planted.filter((wish) => !wish.closed).length;
  const closedPlantedCount = planted.filter((wish) => wish.closed).length;

  return (
    <section className="grid gap-6 py-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="rounded-lg border border-vine/20 bg-paper p-6 shadow-plate">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-mono text-sm text-vine">wallet garden</p>
              <h2 className="font-display text-4xl font-medium leading-tight text-moss">Your plot</h2>
            </div>
            <Button asChild>
              <Link to="/create">
                <Plus className="h-4 w-4" aria-hidden="true" />
                Register a specimen
              </Link>
            </Button>
          </div>
          <p className="mt-2 text-sm leading-6 text-moss/70">Two beds: wishes you planted and wishes you watered.</p>
          {!hasWallet ? (
            <div className="mt-5 flex flex-col gap-3 rounded-lg border border-clay/25 bg-glasshouse p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-vine/25 bg-paper text-vine">
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="text-sm leading-6 text-moss/75">Connect your wallet to view the wishes you planted and watered.</p>
              </div>
              <Button type="button" variant="vine" onClick={wallet.connect} disabled={wallet.isConnecting}>
                {wallet.isConnecting ? "Opening wallet" : "Connect wallet"}
              </Button>
            </div>
          ) : null}
        </div>
        <div className="relative overflow-hidden rounded-lg border border-moss/20 bg-glasshouse p-5 shadow-plate">
          <span className="absolute right-4 top-4 rounded-sm bg-clay px-2 py-1 font-mono text-xs text-paper">plot</span>
          <SpecimenGrowth progress={72} size="sm" wishKey="dashboard-plot" className="mx-auto h-64 max-w-[260px]" />
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-md border border-vine/20 bg-paper p-3">
              <p className="font-mono text-xs text-moss/60">Planted</p>
              <p className="font-display text-2xl text-vine">{planted.length}</p>
            </div>
            <div className="rounded-md border border-clay/25 bg-paper p-3">
              <p className="font-mono text-xs text-moss/60">Watered</p>
              <p className="font-display text-2xl text-clay">{watered.length}</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="planted">
        <TabsList aria-label="Dashboard sections">
          <TabsTrigger value="planted">Planted</TabsTrigger>
          <TabsTrigger value="watered">Watered</TabsTrigger>
        </TabsList>

        <TabsContent value="planted">
          {hasWallet && planted.length === 0 ? (
            <IllustratedEmptyState title="No specimens yet - plant the first one." text="Your planted wishes will appear here with one-tap collecting when funds are available." actionLabel="Register a specimen" actionTo="/create" progress={58} className="mb-5" />
          ) : null}
          {hasWallet && planted.length > 0 ? (
            <div className="mb-5 flex flex-col gap-3 rounded-lg border border-vine/20 bg-paper p-3 shadow-plate sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-display text-lg font-medium text-moss">{plantedFilter === "open" ? "Open wishes" : "Closed wishes"}</p>
                <p className="mt-1 text-sm text-moss/65">
                  {plantedFilter === "open" ? `${openPlantedCount} still accepting help.` : `${closedPlantedCount} closed to new donations.`}
                </p>
              </div>
              <div className="relative w-full sm:w-52">
                <button
                  type="button"
                  className="flex min-h-10 w-full cursor-pointer items-center justify-between gap-3 rounded-md border border-moss/25 bg-glasshouse px-3 py-2 text-left text-sm font-semibold text-moss transition-colors hover:border-vine hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                  aria-haspopup="listbox"
                  aria-expanded={filterOpen}
                  onClick={() => setFilterOpen((open) => !open)}
                >
                  <span>{plantedFilter === "open" ? "Open wishes" : "Closed wishes"}</span>
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
                        ["open", `Open wishes (${openPlantedCount})`],
                        ["closed", `Closed wishes (${closedPlantedCount})`]
                      ] as const).map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          role="option"
                          aria-selected={plantedFilter === value}
                          className={cn(
                            "flex min-h-9 cursor-pointer items-center justify-between rounded-sm px-3 text-sm text-moss transition-colors hover:bg-glasshouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard",
                            plantedFilter === value ? "bg-glasshouse font-semibold text-vine" : ""
                          )}
                          onClick={() => {
                            setPlantedFilter(value);
                            setFilterOpen(false);
                          }}
                        >
                          {label}
                          {plantedFilter === value ? <Check className="h-4 w-4" aria-hidden="true" /> : null}
                        </button>
                      ))}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          ) : null}
          {hasWallet && planted.length > 0 && filteredPlanted.length === 0 ? (
            <IllustratedEmptyState
              title={plantedFilter === "open" ? "No open wishes." : "No closed wishes."}
              text={plantedFilter === "open" ? "Every specimen in your plot is closed to new donations." : "Closed wishes will appear here after you delete them."}
              progress={plantedFilter === "open" ? 36 : 8}
              className="mb-5"
            />
          ) : null}
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]">
            <motion.div className="grid gap-5 sm:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
              {filteredPlanted.map((wish, index) => (
                <div key={`${wish.id.toString()}-${index}`} className="grid gap-3">
                  <WishCard wish={wish} index={index} />
                  <DeleteWishAction wish={wish} onConfirmed={onConfirmed} compact />
                </div>
              ))}
            </motion.div>
            <div className="grid content-start gap-4">
              {hasWallet &&
                planted
                  .filter((wish) => wish.recipient.toLowerCase() === address && wish.balance > 0n)
                  .map((wish) => (
                    <WithdrawPanel key={wish.id.toString()} wish={wish} onConfirmed={onConfirmed} />
                  ))}
              {!hasWallet ? <Empty text="Connect wallet to collect funds from your own specimens." /> : null}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="watered">
          {hasWallet && watered.length === 0 ? (
            <IllustratedEmptyState title="No watered specimens yet." text="Wishes you help grow will appear here from Donated event logs." actionLabel="Explore wishes" actionTo="/" progress={50} className="mb-5" />
          ) : null}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {watered.map((wish, index) => (
              <WishCard key={`${wish.id.toString()}-${index}`} wish={wish} index={index} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <Card className="border-clay/25 p-5">
      <p className="text-sm text-moss/70">{text}</p>
    </Card>
  );
}
