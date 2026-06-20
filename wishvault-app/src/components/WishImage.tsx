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
  const [sourceIndex, setSourceIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = sources[sourceIndex];

  useEffect(() => {
    setSourceIndex(0);
    setIsLoaded(false);
    setFailed(false);
  }, [sourceKey]);

  if (!src || failed) return <>{fallback}</>;

  return (
    <>
      {!isLoaded ? fallback : null}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ objectPosition: imageObjectPosition(imageURI), display: isLoaded ? "block" : "none" }}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          const nextIndex = sourceIndex + 1;
          if (nextIndex < sources.length) {
            setSourceIndex(nextIndex);
            setIsLoaded(false);
            return;
          }
          setFailed(true);
        }}
      />
    </>
  );
}
