import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Leaf, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { WishImage } from "@/components/WishImage";
import type { Wish } from "@/lib/contracts";
import { compactUsdc, percentRaised, specimenNumber } from "@/lib/format";

type WishCardProps = {
  wish: Wish;
  index: number;
};

export function WishCard({ wish, index }: WishCardProps) {
  const progress = percentRaised(wish.totalRaised, wish.goal);
  const displayProgress = progress || (wish.goal === 0n ? 38 : progress);
  const hasGoal = wish.goal > 0n;

  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.045 }}
      whileHover={{ y: -7 }}
      className="h-full"
    >
      <Card className="group h-full overflow-hidden transition-all duration-300 hover:border-vine hover:bg-[#fbfcf6] hover:ring-2 hover:ring-vine/35 hover:shadow-[0_18px_38px_rgba(43,58,44,0.16)]">
        <Link
          to={`/wish/${wish.id.toString()}`}
          className="block h-full cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-glasshouse"
        >
          <div className="relative aspect-[4/3] overflow-hidden border-b border-moss/15 bg-glasshouse">
            <WishImage
              imageURI={wish.imageURI}
              alt=""
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
              fallback={<BotanicalImage progress={Math.max(35, displayProgress)} wishKey={wish.id.toString()} />}
            />
            <span className="absolute left-3 top-3 rounded-sm border border-moss/25 bg-paper/95 px-2 py-1 font-mono text-xs text-moss shadow-sm">
              {specimenNumber(wish.id)}
            </span>
            {wish.closed ? (
              <span className="absolute right-3 top-3 rounded-sm border border-moss bg-paper px-2 py-1 text-xs font-semibold text-moss">
                Closed
              </span>
            ) : progress >= 100 ? (
              <span className="absolute right-3 top-3 rounded-sm bg-clay px-2 py-1 text-xs font-semibold text-paper">
                Funded
              </span>
            ) : progress >= 90 ? (
              <span className="absolute right-3 top-3 rounded-sm border border-clay/40 bg-paper/95 px-2 py-1 text-xs font-semibold text-clay">
                Budding
              </span>
            ) : null}
          </div>

          <div className="grid gap-4 p-5">
            <div>
              <h2 className="font-display text-xl font-medium leading-tight text-moss">{wish.title || "Untitled specimen"}</h2>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-moss/70">{wish.description || "No note has been added yet."}</p>
            </div>

            <div className="rounded-md border border-vine/15 bg-glasshouse/70 px-3 py-2">
              <SpecimenGrowth progress={displayProgress} size="sm" wishKey={wish.id.toString()} />
            </div>

            <div className="flex items-end justify-between gap-3">
              <div className="font-mono text-sm text-moss mono-tabular">
                <div>
                  <span className="text-vine">{compactUsdc(wish.totalRaised)}</span> USDC
                </div>
                <div className="text-xs text-moss/60">{hasGoal ? `of ${compactUsdc(wish.goal)} goal` : "open-ended"}</div>
              </div>
              <Button asChild size="sm" variant="secondary">
                <span>
                  Help it grow
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </Button>
            </div>
          </div>
        </Link>
      </Card>
    </motion.article>
  );
}

function BotanicalImage({ progress, wishKey }: { progress: number; wishKey: string }) {
  return (
    <div className="relative h-full w-full bg-[radial-gradient(circle_at_25%_20%,rgba(217,165,61,0.2),transparent_24%),linear-gradient(135deg,rgba(91,140,90,0.18),transparent_42%),#EDF1E9]">
      <div className="absolute inset-4 rounded-md border border-moss/10 bg-paper/45" />
      <div className="absolute left-5 top-1/2 hidden -translate-y-1/2 items-center gap-2 rounded-md border border-vine/25 bg-paper/80 px-2 py-1 font-mono text-[11px] text-vine sm:flex">
        <Leaf className="h-3 w-3" aria-hidden="true" />
        gift plate
      </div>
      <div className="absolute bottom-4 right-4 inline-flex h-10 w-10 items-center justify-center rounded-md border border-clay/35 bg-paper text-clay shadow-sm">
        <Sprout className="h-5 w-5" aria-hidden="true" />
      </div>
      <div className="absolute inset-x-12 bottom-0 top-3 opacity-95">
        <SpecimenGrowth progress={Math.min(100, progress)} size="sm" wishKey={`plate-${wishKey}`} />
      </div>
    </div>
  );
}
