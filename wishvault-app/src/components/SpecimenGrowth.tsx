import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { cn } from "@/lib/utils";

gsap.registerPlugin(useGSAP);

type SpecimenGrowthProps = {
  progress: number;
  size?: "sm" | "lg";
  wishKey?: string;
  className?: string;
};

export function SpecimenGrowth({ progress, size = "sm", wishKey = "specimen", className }: SpecimenGrowthProps) {
  const rootRef = useRef<SVGSVGElement | null>(null);
  const washRef = useRef<SVGGElement | null>(null);
  const colorLineRef = useRef<SVGGElement | null>(null);
  const clayTipRef = useRef<SVGGElement | null>(null);
  const bloomLeftRef = useRef<SVGEllipseElement | null>(null);
  const bloomRightRef = useRef<SVGEllipseElement | null>(null);
  const bloomTopRef = useRef<SVGEllipseElement | null>(null);
  const bloomBottomRef = useRef<SVGEllipseElement | null>(null);
  const bloomCenterRef = useRef<SVGCircleElement | null>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const bloomPlayedRef = useRef(false);

  const clampedProgress = Math.min(100, Math.max(0, progress));
  const uniqueId = useMemo(() => `growth-${wishKey.replace(/[^a-zA-Z0-9]/g, "")}-${size}`, [wishKey, size]);
  const dimensions = size === "lg" ? "h-[520px] w-full max-w-[500px]" : "h-44 w-full";

  useGSAP(
    () => {
      if (
        !washRef.current ||
        !colorLineRef.current ||
        !clayTipRef.current ||
        !bloomLeftRef.current ||
        !bloomRightRef.current ||
        !bloomTopRef.current ||
        !bloomBottomRef.current ||
        !bloomCenterRef.current
      ) {
        return;
      }

      gsap.set(washRef.current, { y: 265 });
      gsap.set(colorLineRef.current, { y: 265, opacity: 0.92 });
      gsap.set(clayTipRef.current, { autoAlpha: 0 });
      gsap.set([bloomLeftRef.current, bloomRightRef.current, bloomTopRef.current, bloomBottomRef.current, bloomCenterRef.current], {
        autoAlpha: 0,
        scale: 0.18,
        transformOrigin: "50% 50%"
      });

      timelineRef.current = gsap
        .timeline({ paused: true, defaults: { ease: "none" } })
        .to([washRef.current, colorLineRef.current], { y: 0, duration: 1 }, 0)
        .to(clayTipRef.current, { autoAlpha: 0.72, duration: 0.12 }, 0.84);
    },
    { scope: rootRef }
  );

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const target = clampedProgress / 100;
    if (!timelineRef.current) return;

    if (reduceMotion) {
      timelineRef.current.progress(target);
    } else {
      gsap.to(timelineRef.current, {
        progress: target,
        duration: 0.8,
        ease: "power2.out",
        overwrite: "auto"
      });
    }

    if (clampedProgress >= 100 && !bloomPlayedRef.current) {
      bloomPlayedRef.current = true;
      if (reduceMotion) {
        gsap.set([bloomLeftRef.current, bloomRightRef.current, bloomTopRef.current, bloomBottomRef.current, bloomCenterRef.current], {
          autoAlpha: 1,
          scale: 1
        });
        return;
      }
      gsap
        .timeline({ defaults: { ease: "power2.out" } })
        .to([bloomLeftRef.current, bloomRightRef.current, bloomTopRef.current, bloomBottomRef.current], { autoAlpha: 1, scale: 1, duration: 0.48 }, 0)
        .to(bloomCenterRef.current, { autoAlpha: 1, scale: 1, duration: 0.36 }, 0.12)
        .to(washRef.current, { opacity: 0.88, duration: 0.24, yoyo: true, repeat: 1 }, 0.08);
    }

    if (clampedProgress < 100) {
      bloomPlayedRef.current = false;
      gsap.set([bloomLeftRef.current, bloomRightRef.current, bloomTopRef.current, bloomBottomRef.current, bloomCenterRef.current], {
        autoAlpha: 0,
        scale: 0.18
      });
    }
  }, [clampedProgress]);

  return (
    <svg
      ref={rootRef}
      className={cn(dimensions, "overflow-visible", className)}
      viewBox="0 0 220 300"
      role="img"
      aria-label={`Funding growth illustration at ${Math.round(clampedProgress)} percent`}
    >
      <defs>
        <filter id={`${uniqueId}-watercolor`} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018 0.036" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" />
          <feGaussianBlur stdDeviation="0.55" />
        </filter>
        <filter id={`${uniqueId}-paper`} x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="11" result="paperNoise" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="table" tableValues="0 0.18" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" mode="multiply" />
        </filter>
        <clipPath id={`${uniqueId}-plant-clip`}>
          <path d="M109 278 C102 247 104 220 106 190 C109 148 101 114 118 80 C125 65 139 55 153 47 C139 76 133 103 120 130 C138 115 160 105 180 108 C164 123 143 139 121 149 C136 156 151 166 162 183 C143 182 126 176 113 162 C113 201 119 236 109 278 Z" />
          <path d="M101 247 C78 245 58 230 42 209 C66 207 88 216 103 236 Z" />
          <path d="M124 226 C146 212 169 208 190 215 C171 232 147 236 126 229 Z" />
          <path d="M101 110 C78 108 57 96 37 78 C65 78 88 89 104 108 Z" />
          <path d="M125 100 C136 73 157 52 180 42 C172 69 153 90 127 104 Z" />
          <path d="M143 44 C146 31 157 23 168 24 C174 35 170 48 158 59 C151 56 146 51 143 44 Z" />
        </clipPath>
        <clipPath id={`${uniqueId}-rise-window`}>
          <rect x="0" y="0" width="220" height="300" />
        </clipPath>
      </defs>

      <g opacity="0.26" fill="none" stroke="#2B3A2C" strokeLinecap="round">
        <path d="M109 277 C97 267 83 266 68 274 M109 275 C123 264 139 264 154 272 M108 272 C100 260 100 249 105 239" strokeWidth="1.1" />
        <path d="M42 209 C63 212 84 222 101 245 M190 215 C168 216 144 220 124 226" strokeWidth="0.9" />
      </g>

      <g clipPath={`url(#${uniqueId}-plant-clip)`} filter={`url(#${uniqueId}-watercolor)`}>
        <g ref={washRef}>
          <path
            d="M24 306 C36 282 62 288 76 267 C91 244 72 225 93 205 C111 188 141 194 153 171 C165 148 143 132 158 109 C173 86 198 94 207 64 L207 318 L24 318 Z"
            fill="#5B8C5A"
            opacity="0.58"
          />
          <path
            d="M4 314 C18 286 54 296 67 260 C78 228 103 236 113 206 C124 174 98 159 119 134 C138 112 162 124 179 96 C190 78 184 61 199 43 L216 318 L4 318 Z"
            fill="#5B8C5A"
            opacity="0.42"
          />
          <path
            d="M52 318 C61 292 91 284 96 256 C101 229 89 215 112 190 C136 164 122 140 141 118 C162 94 154 72 171 47 L196 318 Z"
            fill="#5B8C5A"
            opacity="0.36"
          />
        </g>
      </g>

      <g clipPath={`url(#${uniqueId}-plant-clip)`}>
        <g ref={colorLineRef} fill="none" stroke="#5B8C5A" strokeLinecap="round" strokeLinejoin="round" filter={`url(#${uniqueId}-paper)`}>
          {plantLineArt(2.7, 2.0, 1.75)}
        </g>
      </g>

      <g ref={clayTipRef} clipPath={`url(#${uniqueId}-plant-clip)`} filter={`url(#${uniqueId}-watercolor)`}>
        <path d="M142 42 C145 29 158 19 171 22 C178 36 171 53 158 62 C150 59 144 52 142 42 Z" fill="#B5562E" opacity="0.58" />
      </g>

      <g fill="none" stroke="#2B3A2C" strokeLinecap="round" strokeLinejoin="round">
        {plantLineArt(2.2, 1.65, 1.35)}
      </g>

      <g fill="#B5562E" opacity="0.96" filter={`url(#${uniqueId}-watercolor)`}>
        <ellipse ref={bloomLeftRef} cx="139" cy="42" rx="17" ry="10" transform="rotate(-34 139 42)" />
        <ellipse ref={bloomRightRef} cx="164" cy="40" rx="17" ry="10" transform="rotate(32 164 40)" />
        <ellipse ref={bloomTopRef} cx="152" cy="29" rx="10" ry="17" transform="rotate(4 152 29)" />
        <ellipse ref={bloomBottomRef} cx="153" cy="55" rx="10" ry="15" transform="rotate(-4 153 55)" />
        <circle ref={bloomCenterRef} cx="152" cy="43" r="7.5" fill="#D9A53D" />
      </g>
    </svg>
  );
}

function plantLineArt(stemWidth: number, leafWidth: number, veinWidth: number) {
  return (
    <>
      <path d="M109 278 C102 247 104 220 106 190 C109 148 101 114 118 80 C125 65 139 55 153 47" strokeWidth={stemWidth} />
      <path d="M109 277 C98 265 83 264 68 274 M109 275 C123 264 139 264 154 272 M108 272 C100 260 100 249 105 239" strokeWidth={veinWidth} />
      <path d="M101 247 C78 245 58 230 42 209 C66 207 88 216 103 236 C101 241 101 244 101 247 Z" strokeWidth={leafWidth} />
      <path d="M124 226 C146 212 169 208 190 215 C171 232 147 236 126 229 C125 228 124 227 124 226 Z" strokeWidth={leafWidth} />
      <path d="M101 110 C78 108 57 96 37 78 C65 78 88 89 104 108 C103 109 102 110 101 110 Z" strokeWidth={leafWidth} />
      <path d="M125 100 C136 73 157 52 180 42 C172 69 153 90 127 104 C126 103 126 101 125 100 Z" strokeWidth={leafWidth} />
      <path d="M153 47 C139 76 133 103 120 130 C138 115 160 105 180 108 C164 123 143 139 121 149" strokeWidth={leafWidth} />
      <path d="M113 162 C128 176 143 182 162 183 C151 166 136 156 121 149" strokeWidth={leafWidth} />
      <path d="M43 210 C63 213 84 223 101 245 M190 215 C168 216 144 220 124 226 M38 79 C60 83 83 94 102 109 M179 43 C158 57 141 76 126 101" strokeWidth={veinWidth} opacity="0.72" />
      <path d="M143 44 C146 31 157 23 168 24 C174 35 170 48 158 59 C151 56 146 51 143 44 Z" strokeWidth={leafWidth} />
      <path d="M154 62 C149 54 149 40 157 27" strokeWidth={veinWidth} opacity="0.72" />
    </>
  );
}
