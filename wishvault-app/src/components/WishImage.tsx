import { useEffect, useMemo, useState, type ReactNode } from "react";
import { imageObjectPosition, resolveImageUrls } from "@/lib/ipfs";

type WishImageProps = {
  imageURI?: string;
  previewSrc?: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
  failureFallback?: ReactNode;
};

const IMAGE_LOAD_TIMEOUT_MS = 4_500;

export function WishImage({ imageURI, previewSrc, alt, className, fallback, failureFallback }: WishImageProps) {
  const sources = useMemo(() => {
    const remoteSources = resolveImageUrls(imageURI);
    return previewSrc ? [previewSrc, ...remoteSources.filter((src) => src !== previewSrc)] : remoteSources;
  }, [imageURI, previewSrc]);
  const sourceKey = sources.join("|");
  const [activeSrc, setActiveSrc] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setActiveSrc(undefined);
    setIsLoading(Boolean(sources.length));
    setFailed(false);

    if (!sources.length) {
      setIsLoading(false);
      setFailed(true);
      return;
    }

    async function loadSources() {
      try {
        const src = await firstLoadedImage(sources);
        if (!cancelled) setActiveSrc(src);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadSources();

    return () => {
      cancelled = true;
    };
  }, [sourceKey, sources]);

  if (failed) return <>{failureFallback ?? fallback}</>;

  return (
    <div className="relative h-full w-full overflow-hidden bg-glasshouse">
      {isLoading ? <ImageLoadingPlate /> : null}
      {activeSrc ? (
        <img
          src={activeSrc}
          alt={alt}
          className={`absolute inset-0 animate-[image-reveal_220ms_ease-out] ${className ?? ""}`}
          loading="lazy"
          decoding="async"
          style={{ objectPosition: imageObjectPosition(imageURI) }}
        />
      ) : null}
    </div>
  );
}

function firstLoadedImage(sources: string[]) {
  return new Promise<string>((resolve, reject) => {
    let pending = sources.length;
    let settled = false;

    sources.forEach((src) => {
      preloadImage(src)
        .then(() => {
          if (settled) return;
          settled = true;
          resolve(src);
        })
        .catch(() => {
          pending -= 1;
          if (!settled && pending === 0) reject(new Error("All image sources failed."));
        });
    });
  });
}

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    const timeoutId = window.setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      reject(new Error("Image load timed out."));
    }, IMAGE_LOAD_TIMEOUT_MS);
    image.onload = () => {
      window.clearTimeout(timeoutId);
      resolve();
    };
    image.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("Image failed to load."));
    };
    image.decoding = "async";
    image.src = src;
    if (image.complete && image.naturalWidth > 0) {
      window.clearTimeout(timeoutId);
      resolve();
    }
  });
}

function ImageLoadingPlate() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-glasshouse">
      <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,rgba(248,249,243,0.35),rgba(248,249,243,0.85),rgba(248,249,243,0.35))]" />
    </div>
  );
}
