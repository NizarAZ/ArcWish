import { PINATA_GATEWAY, PINATA_JWT } from "@/lib/arc-config";

const PINATA_PIN_FILE_ENDPOINT = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const PUBLIC_IPFS_GATEWAYS = ["https://gateway.pinata.cloud/ipfs", "https://w3s.link/ipfs", "https://dweb.link/ipfs", "https://ipfs.io/ipfs"];
export const MAX_PINATA_IMAGE_BYTES = 10 * 1024 * 1024;
const DEFAULT_IMAGE_FOCUS = { x: 50, y: 50 } as const;

type PinataUploadResponse = {
  IpfsHash?: string;
  PinSize?: number;
  Timestamp?: string;
  isDuplicate?: boolean;
  error?: string;
};

export type PinataUploadResult = {
  cid: string;
  imageURI: string;
  gatewayUrl: string;
};

export type ImageFocus = {
  x: number;
  y: number;
};

export function validateImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file for the specimen plate.");
  }
  if (file.size > MAX_PINATA_IMAGE_BYTES) {
    throw new Error("Choose an image under 10 MB before uploading to IPFS.");
  }
}

export function uploadImageToPinata(file: File, onProgress?: (progress: number) => void) {
  validateImageFile(file);
  const jwt = PINATA_JWT?.trim();
  if (!jwt) {
    throw new Error("Pinata JWT is not configured in the ArcWish frontend .env file.");
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("pinataMetadata", JSON.stringify({ name: file.name || "arcwish-specimen-image" }));
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  return new Promise<PinataUploadResult>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", PINATA_PIN_FILE_ENDPOINT);
    request.setRequestHeader("Authorization", `Bearer ${jwt}`);

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.round((event.loaded / event.total) * 100));
    };

    request.onerror = () => reject(new Error("Pinata upload failed before the image reached IPFS."));
    request.onload = () => {
      let payload: PinataUploadResponse;
      try {
        payload = JSON.parse(request.responseText) as PinataUploadResponse;
      } catch {
        reject(new Error("Pinata returned an unreadable upload response."));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error(payload.error || `Pinata upload failed with status ${request.status}.`));
        return;
      }

      if (!payload.IpfsHash) {
        reject(new Error("Pinata did not return an IPFS CID for this image."));
        return;
      }

      const imageURI = `ipfs://${payload.IpfsHash}`;
      resolve({
        cid: payload.IpfsHash,
        imageURI,
        gatewayUrl: resolveImageUrl(imageURI) ?? ""
      });
    };

    request.send(formData);
  });
}

export function resolveImageUrl(imageURI?: string) {
  return resolveImageUrls(imageURI)[0];
}

export function resolveImageUrls(imageURI?: string) {
  const uri = imageURI?.trim();
  if (!uri) return [];
  const sourceURI = stripImageFocusParams(uri);
  if (sourceURI.startsWith("ipfs://")) {
    return ipfsToGatewayUrls(sourceURI);
  }
  return [sourceURI];
}

export function ipfsToGatewayUrl(ipfsUri: string) {
  return ipfsToGatewayUrls(ipfsUri)[0];
}

export function ipfsToGatewayUrls(ipfsUri: string) {
  const path = ipfsUri.replace(/^ipfs:\/\//, "").replace(/^ipfs\//, "");
  if (!path) return [];
  return unique([normalizeGateway(PINATA_GATEWAY), ...PUBLIC_IPFS_GATEWAYS])
    .filter((gateway): gateway is string => Boolean(gateway))
    .map((gateway) => `${gateway}/${path}`);
}

export function getImageFocus(imageURI?: string): ImageFocus {
  const query = imageURI?.trim().split("#")[0]?.split("?")[1];
  if (!query) return { ...DEFAULT_IMAGE_FOCUS };

  const params = new URLSearchParams(query);
  return {
    x: normalizeFocusValue(params.get("focusX"), DEFAULT_IMAGE_FOCUS.x),
    y: normalizeFocusValue(params.get("focusY"), DEFAULT_IMAGE_FOCUS.y)
  };
}

export function buildImageURIWithFocus(imageURI: string | undefined, focus: ImageFocus) {
  const uri = imageURI?.trim();
  if (!uri) return "";

  const [withoutHash, hash] = uri.split("#", 2);
  const [base, query = ""] = withoutHash.split("?", 2);
  const params = new URLSearchParams(query);
  params.set("focusX", String(clampPercent(focus.x)));
  params.set("focusY", String(clampPercent(focus.y)));

  const nextQuery = params.toString();
  return `${base}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export function stripImageFocusParams(imageURI?: string) {
  const uri = imageURI?.trim();
  if (!uri) return "";

  const [withoutHash, hash] = uri.split("#", 2);
  const [base, query = ""] = withoutHash.split("?", 2);
  const params = new URLSearchParams(query);
  params.delete("focusX");
  params.delete("focusY");

  const nextQuery = params.toString();
  return `${base}${nextQuery ? `?${nextQuery}` : ""}${hash ? `#${hash}` : ""}`;
}

export function imageObjectPosition(imageURI?: string) {
  const focus = getImageFocus(imageURI);
  return `${focus.x}% ${focus.y}%`;
}

function normalizeGateway(gateway?: string) {
  const trimmed = gateway?.trim();
  if (!trimmed) return undefined;
  return trimmed.replace(/\/+$/, "").replace(/\/ipfs$/, "");
}

function normalizeFocusValue(value: string | null, fallback: number) {
  if (value === null) return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return clampPercent(numeric);
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function unique(values: Array<string | undefined>) {
  return [...new Set(values)];
}
