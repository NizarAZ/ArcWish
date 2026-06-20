import { useEffect, useMemo, useState, type ReactNode } from "react";
import { imageObjectPosition, resolveImageUrls } from "@/lib/ipfs";

type WishImageProps = {
  imageURI?: string;
  alt: string;
  className?: string;
  fallback: ReactNode;
};

export function WishImage({ imageURI, alt, className, fallback }: WishImageProps) {
  const sources = useMemo(() => resolveImageUrls(imageURI), [imageURI]);
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

    async function loadNext(index: number) {
      const src = sources[index];
      if (!src) {
        if (!cancelled) {
          setIsLoading(false);
          setFailed(true);
        }
        return;
      }

      try {
        await preloadImage(src);
        if (!cancelled) {
          setActiveSrc(src);
          setIsLoading(false);
        }
      } catch {
        void loadNext(index + 1);
      }
    }

    void loadNext(0);

    return () => {
      cancelled = true;
    };
  }, [sourceKey, sources]);

  if (failed) return <>{fallback}</>;

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

function preloadImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Image failed to load."));
    image.decoding = "async";
    image.src = src;
    if (image.complete && image.naturalWidth > 0) resolve();
  });
}

function ImageLoadingPlate() {
  return (
    <div className="absolute inset-0 grid place-items-center bg-glasshouse">
      <div className="h-full w-full animate-pulse bg-[linear-gradient(110deg,rgba(248,249,243,0.35),rgba(248,249,243,0.85),rgba(248,249,243,0.35))]" />
    </div>
  );
}
