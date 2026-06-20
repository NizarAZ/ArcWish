import { ArrowRight, Sprout } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { cn } from "@/lib/utils";

type IllustratedEmptyStateProps = {
  title: string;
  text: string;
  actionLabel?: string;
  actionTo?: string;
  progress?: number;
  className?: string;
};

export function IllustratedEmptyState({ title, text, actionLabel, actionTo, progress = 54, className }: IllustratedEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
      className={cn(
        "grid overflow-hidden rounded-lg border border-vine/25 bg-paper shadow-plate md:grid-cols-[220px_minmax(0,1fr)]",
        className
      )}
    >
      <div className="relative min-h-48 border-b border-vine/20 bg-glasshouse md:border-b-0 md:border-r">
        <div className="absolute left-5 top-5 rounded-md border border-clay/30 bg-paper px-2 py-1 font-mono text-xs text-clay">No. 000</div>
        <div className="absolute inset-x-6 bottom-0 top-5">
          <SpecimenGrowth progress={progress} size="sm" wishKey={`empty-${title}`} />
        </div>
      </div>
      <div className="grid content-center gap-4 p-6">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-vine/30 bg-glasshouse text-vine">
          <Sprout className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-display text-2xl font-medium leading-tight text-moss">{title}</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-moss/72">{text}</p>
        </div>
        {actionLabel && actionTo ? (
          <Button asChild variant="vine" className="w-fit">
            <Link to={actionTo}>
              {actionLabel}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : null}
      </div>
    </motion.div>
  );
}
