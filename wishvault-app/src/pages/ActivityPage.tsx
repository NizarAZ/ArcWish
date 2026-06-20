import { motion } from "framer-motion";
import { ActivityFeed } from "@/components/ActivityFeed";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import type { ActivityItem, Wish } from "@/lib/contracts";

type ActivityPageProps = {
  wishes: Wish[];
  activity: ActivityItem[];
};

export function ActivityPage({ wishes, activity }: ActivityPageProps) {
  return (
    <section className="grid gap-6 py-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-lg border border-vine/20 bg-paper p-6 shadow-plate">
          <p className="font-mono text-sm text-vine">watering log</p>
          <h2 className="font-display text-4xl font-medium leading-tight text-moss">Activity</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-moss/70">A public feed of planted, watered, collected, and closed specimens.</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="min-h-10 cursor-pointer rounded-md border border-vine bg-vine px-4 text-sm font-semibold text-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard">
              All events
            </button>
            <button className="min-h-10 cursor-pointer rounded-md border border-moss/25 bg-glasshouse px-4 text-sm font-semibold text-moss transition-colors hover:border-clay hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard">
              Gifts only
            </button>
            <button className="min-h-10 cursor-pointer rounded-md border border-moss/25 bg-glasshouse px-4 text-sm font-semibold text-moss transition-colors hover:border-vine hover:text-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard">
              Collected
            </button>
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="relative overflow-hidden rounded-lg border border-moss/20 bg-glasshouse p-5 shadow-plate"
        >
          <span className="absolute right-4 top-4 rounded-sm bg-clay px-2 py-1 font-mono text-xs text-paper">recent</span>
          <SpecimenGrowth progress={86} size="sm" wishKey="activity-plate" className="mx-auto h-64 max-w-[260px]" />
          <div className="rounded-md border border-vine/20 bg-paper p-3">
            <p className="font-display text-lg font-medium text-moss">Latest watering</p>
            <p className="font-mono text-sm text-vine mono-tabular">{activity.length} visible entries</p>
          </div>
        </motion.div>
      </div>
      {activity.length === 0 ? (
        <p className="rounded-lg border border-clay/20 bg-paper px-4 py-3 text-sm leading-6 text-moss/72 shadow-plate">
          No live activity yet. The watering log has zero Arc events right now.
        </p>
      ) : null}
      <ActivityFeed activity={activity} wishes={wishes} />
    </section>
  );
}
