import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SpecimenGrowth } from "@/components/SpecimenGrowth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";

export function GrowthDev() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialProgress = useMemo(() => {
    const value = Number(searchParams.get("progress") ?? "50");
    if (!Number.isFinite(value)) return 50;
    return Math.min(100, Math.max(0, value));
  }, [searchParams]);
  const [progress, setProgress] = useState(initialProgress);

  function updateProgress(value: number) {
    setProgress(value);
    setSearchParams({ progress: String(value) }, { replace: true });
  }

  return (
    <section className="grid gap-6 py-6">
      <div className="grid gap-2">
        <p className="font-mono text-sm text-vine">/dev/growth</p>
        <h2 className="font-display text-4xl font-medium text-moss">Specimen growth study</h2>
        <p className="max-w-2xl text-sm leading-6 text-moss/70">
          A fixed fine-line specimen plate with a scrubbed watercolor wash. Use <span className="font-mono">?progress=0</span>,{" "}
          <span className="font-mono">25</span>, <span className="font-mono">50</span>, <span className="font-mono">75</span>,{" "}
          <span className="font-mono">90</span>, or <span className="font-mono">100</span> for deterministic review frames.
        </p>
      </div>
      <Card className="overflow-hidden border-moss/25">
        <CardHeader>
          <CardTitle>{Math.round(progress)}% funded</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px] md:items-center">
          <div className="flex min-h-[560px] items-center justify-center rounded-lg border border-moss/15 bg-glasshouse p-5">
            <SpecimenGrowth progress={progress} size="lg" wishKey="dev" />
          </div>
          <div className="grid gap-5">
            <label htmlFor="growth-slider" className="text-sm font-semibold text-moss">
              Funding progress
            </label>
            <Slider id="growth-slider" min={0} max={100} value={progress} onChange={(event) => updateProgress(Number(event.currentTarget.value))} />
            <div className="grid grid-cols-3 gap-2">
              {[0, 25, 50, 75, 90, 100].map((value) => (
                <button
                  key={value}
                  type="button"
                  className="min-h-10 cursor-pointer rounded-md border border-moss/25 bg-paper px-2 font-mono text-xs text-moss transition-colors hover:border-vine hover:text-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                  onClick={() => updateProgress(value)}
                >
                  {value}%
                </button>
              ))}
            </div>
            <p className="text-sm leading-6 text-moss/70">
              The bloom sequence should only appear at 100%. At 90%, only the bud tip begins to show Clay.
            </p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
