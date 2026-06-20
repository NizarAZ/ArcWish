import { formatUnits, parseUnits } from "ethers";
import { ARC_EXPLORER } from "@/lib/arc-config";

export const USDC_DECIMALS = 6;

export function parseUsdc(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return 0n;
  return parseUnits(trimmed, USDC_DECIMALS);
}

export function formatUsdc(value: bigint, decimals = 2) {
  const numeric = Number(formatUnits(value, USDC_DECIMALS));
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numeric);
}

export function compactUsdc(value: bigint) {
  const numeric = Number(formatUnits(value, USDC_DECIMALS));
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: numeric >= 100 ? 0 : 2
  }).format(numeric);
}

export function percentRaised(totalRaised: bigint, goal: bigint) {
  if (goal === 0n) return 0;
  const pct = Number((totalRaised * 10_000n) / goal) / 100;
  return Math.min(100, Math.max(0, pct));
}

export function neededAmount(totalRaised: bigint, goal: bigint) {
  if (goal === 0n || totalRaised >= goal) return 0n;
  return goal - totalRaised;
}

export function truncateAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function specimenNumber(id: bigint | number) {
  return `No. ${Number(id).toString().padStart(3, "0")}`;
}

export function txUrl(hash: string) {
  return `${ARC_EXPLORER}/tx/${hash}`;
}

export function addressUrl(address: string) {
  return `${ARC_EXPLORER}/address/${address}`;
}
