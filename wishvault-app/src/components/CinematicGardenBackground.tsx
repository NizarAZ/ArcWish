import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

const referenceBackgroundTokens = {
  paper: "#fbfbf7",
  warmPaper: "rgba(221, 210, 168, 0.14)",
  vineOlive: "rgba(86, 96, 43, 0.18)"
};

const backgroundSections = [
  { name: "App Open", pattern: "load-clip-reveal" },
  { name: "Left Gutter", pattern: "fixed-watermark" },
  { name: "Settled Background", pattern: "single-reference-vine" },
  { name: "Reduced Motion", pattern: "settled-still" }
];

export function CinematicGardenBackground() {
  const scopeRef = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const vines = gsap.utils.toArray<HTMLElement>(".reference-vine-image");
      const glows = gsap.utils.toArray<HTMLElement>(".reference-vine-glow");

      if (reduceMotion) {
        gsap.set(vines, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", y: 0, scale: 1 });
        gsap.set(glows, { autoAlpha: 1 });
        return;
      }

      gsap.set(vines, {
        autoAlpha: 0,
        clipPath: "inset(100% 0% 0% 0%)",
        y: 36,
        scale: 0.985,
        transformOrigin: "50% 100%"
      });
      gsap.set(glows, { autoAlpha: 0 });

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .to(glows, { autoAlpha: 1, duration: 0.8 }, 0)
        .to(vines, { autoAlpha: 1, clipPath: "inset(0% 0% 0% 0%)", y: 0, scale: 1, duration: 2.15 }, 0.08);
    },
    { scope: scopeRef }
  );

  return (
    <div
      ref={scopeRef}
      aria-hidden="true"
      data-patterns={backgroundSections.map((section) => section.pattern).join(" ")}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 48% 0%, ${referenceBackgroundTokens.warmPaper}, transparent 42%),
            linear-gradient(90deg, rgba(248,249,243,0.65), transparent 28%, transparent 72%, rgba(248,249,243,0.62))`
        }}
      />
      <div
        className="reference-vine-glow absolute -left-24 top-16 h-[760px] w-[360px] rounded-full blur-3xl"
        style={{ background: referenceBackgroundTokens.vineOlive }}
      />
      <img
        src="/reference-vine-transparent.png?v=2"
        alt=""
        className="reference-vine-image reference-vine-left absolute -left-[235px] top-[64px] h-[820px] w-auto select-none object-contain opacity-[0.38] sm:-left-[82px] sm:top-[88px] sm:h-[920px] sm:opacity-[0.56] lg:-left-[34px]"
        draggable="false"
      />
    </div>
  );
}
