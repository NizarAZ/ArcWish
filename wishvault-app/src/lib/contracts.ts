import { BrowserProvider, Contract, JsonRpcProvider, type Eip1193Provider, type JsonRpcSigner } from "ethers";
import { ARC_RPC, ARC_TESTNET, ARC_TESTNET_WALLET_PARAMS, ARC_USDC_ADDRESS, WISH_REGISTRY_ADDRESS, WISH_REGISTRY_DEPLOY_BLOCK } from "@/lib/arc-config";
import { ERC20_ABI, WISH_REGISTRY_ABI } from "@/lib/abis";

declare global {
  interface Window {
    ethereum?: InjectedWalletProvider;
  }
}

type InjectedWalletProvider = Eip1193Provider & {
  isMetaMask?: boolean;
  providers?: InjectedWalletProvider[];
  on?: (event: string, listener: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, listener: (...args: unknown[]) => void) => void;
};

export type Wish = {
  id: bigint;
  creator: string;
  recipient: string;
  title: string;
  description: string;
  imageURI: string;
  goal: bigint;
  totalRaised: bigint;
  balance: bigint;
  closed: boolean;
};

export function hasWishAvatar(wish: Pick<Wish, "imageURI">) {
  const imageURI = wish.imageURI.trim().toLowerCase();
  return Boolean(imageURI && imageURI !== "ipfs://none" && imageURI !== "none");
}

export type ActivityKind = "WishCreated" | "Donated" | "Withdrawn" | "WishClosed";

export type ActivityItem = {
  kind: ActivityKind;
  wishId: bigint;
  actor: string;
  amount?: bigint;
  detail: string;
  txHash: string;
  blockNumber: number;
  logIndex: number;
};

export const readProvider = new JsonRpcProvider(ARC_RPC, ARC_TESTNET.chainIdDecimal);
const EVENT_QUERY_BLOCK_SPAN = 9_500;
const ACTIVITY_EVENT_NAMES = new Set<ActivityKind>(["WishCreated", "Donated", "Withdrawn", "WishClosed"]);

export function hasRegistryAddress() {
  return Boolean(WISH_REGISTRY_ADDRESS && WISH_REGISTRY_ADDRESS !== "0x0000000000000000000000000000000000000000");
}

export function getReadRegistry() {
  if (!hasRegistryAddress()) return null;
  return new Contract(WISH_REGISTRY_ADDRESS!, WISH_REGISTRY_ABI, readProvider);
}

export function getReadUsdc() {
  return new Contract(ARC_USDC_ADDRESS, ERC20_ABI, readProvider);
}

export function getWalletProvider() {
  if (!window.ethereum) throw new Error("No wallet found. Install MetaMask and try again.");
  return window.ethereum.providers?.find((provider) => provider.isMetaMask) ?? window.ethereum;
}

export function getBrowserProvider() {
  return new BrowserProvider(getWalletProvider());
}

export async function ensureArcTestnet() {
  const walletProvider = getWalletProvider();
  const switchToArc = () =>
    walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: ARC_TESTNET.chainId }]
    });

  try {
    await switchToArc();
  } catch (error) {
    if (hasWalletErrorCode(error, 4902)) {
      try {
        await walletProvider.request({
          method: "wallet_addEthereumChain",
          params: [ARC_TESTNET_WALLET_PARAMS]
        });
        await switchToArc();
      } catch (addError) {
        if (hasWalletErrorCode(addError, 4001)) {
          throw new Error("You're not on Arc Testnet. Switch to Arc Testnet in MetaMask and try again.");
        }
        throw addError;
      }
    }
    else if (hasWalletErrorCode(error, 4001)) {
      throw new Error("You're not on Arc Testnet. Switch to Arc Testnet in MetaMask and try again.");
    } else {
      throw error;
    }
  }

  const activeChainId = await walletProvider.request({ method: "eth_chainId" });
  if (typeof activeChainId === "string" && activeChainId.toLowerCase() !== ARC_TESTNET.chainId.toLowerCase()) {
    throw new Error("You're not on Arc Testnet. Switch to Arc Testnet in MetaMask and try again.");
  }
}

function hasWalletErrorCode(error: unknown, target: number) {
  return walletErrorCodes(error).some((code) => Number(code) === target);
}

function walletErrorCodes(error: unknown): Array<number | string> {
  if (!error || typeof error !== "object") return [];
  const codes: Array<number | string> = [];
  const direct = "code" in error ? (error as { code?: number | string }).code : undefined;
  if (direct !== undefined) codes.push(direct);
  const nestedError = "error" in error ? (error as { error?: unknown }).error : undefined;
  if (nestedError) codes.push(...walletErrorCodes(nestedError));
  const data = "data" in error ? (error as { data?: unknown }).data : undefined;
  if (data) codes.push(...walletErrorCodes(data));
  const original = data && typeof data === "object" && "originalError" in data ? (data as { originalError?: unknown }).originalError : undefined;
  if (original) codes.push(...walletErrorCodes(original));
  const info = "info" in error ? (error as { info?: unknown }).info : undefined;
  const infoError = info && typeof info === "object" && "error" in info ? (info as { error?: unknown }).error : undefined;
  if (infoError) codes.push(...walletErrorCodes(infoError));
  return codes;
}

function walletErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const direct = "message" in error ? (error as { message?: unknown }).message : undefined;
  if (typeof direct === "string" && direct) return direct;
  const nestedError = "error" in error ? (error as { error?: unknown }).error : undefined;
  if (nestedError) {
    const nestedMessage = walletErrorMessage(nestedError);
    if (nestedMessage) return nestedMessage;
  }
  const data = "data" in error ? (error as { data?: unknown }).data : undefined;
  if (data) {
    const dataMessage = walletErrorMessage(data);
    if (dataMessage) return dataMessage;
  }
  const info = "info" in error ? (error as { info?: unknown }).info : undefined;
  if (info) {
    const infoMessage = walletErrorMessage(info);
    if (infoMessage) return infoMessage;
  }
  return undefined;
}

export async function getSignerContracts(signer: JsonRpcSigner) {
  if (!hasRegistryAddress()) throw new Error("WishRegistry is not configured yet.");
  return {
    registry: new Contract(WISH_REGISTRY_ADDRESS!, WISH_REGISTRY_ABI, signer),
    usdc: new Contract(ARC_USDC_ADDRESS, ERC20_ABI, signer)
  };
}

export async function loadWishes(options: { includeWithoutAvatar?: boolean } = {}): Promise<Wish[]> {
  const registry = getReadRegistry();
  if (!registry) return [];

  const count = await registry.wishCount();
  const ids = Array.from({ length: Number(count) }, (_, index) => BigInt(index));
  const wishes = await Promise.all(
    ids.map(async (id) => {
      const wish = await registry.getWish(id);
      return {
        id,
        creator: wish.creator,
        recipient: wish.recipient,
        title: wish.title,
        description: wish.description,
        imageURI: wish.imageURI,
        goal: wish.goal,
        totalRaised: wish.totalRaised,
        balance: wish.balance,
        closed: wish.closed
      } satisfies Wish;
    })
  );

  return options.includeWithoutAvatar ? wishes : wishes.filter(hasWishAvatar);
}

export async function loadActivity(): Promise<ActivityItem[]> {
  const registry = getReadRegistry();
  if (!registry) return [];

  const latestBlock = await readProvider.getBlockNumber();
  if (WISH_REGISTRY_DEPLOY_BLOCK > latestBlock) return [];

  const queries = [];
  for (let fromBlock = WISH_REGISTRY_DEPLOY_BLOCK; fromBlock <= latestBlock; fromBlock += EVENT_QUERY_BLOCK_SPAN + 1) {
    const toBlock = Math.min(fromBlock + EVENT_QUERY_BLOCK_SPAN, latestBlock);
    queries.push(readProvider.getLogs({ address: WISH_REGISTRY_ADDRESS, fromBlock, toBlock }));
  }

  const events = (await Promise.all(queries))
    .flat()
    .flatMap((log): ActivityItem[] => {
      const parsed = registry.interface.parseLog({ topics: log.topics, data: log.data });
      const name = parsed?.name as ActivityKind | undefined;
      if (!parsed || !name || !ACTIVITY_EVENT_NAMES.has(name)) return [];
      if (name === "WishCreated") {
        return [{
          kind: name,
          wishId: parsed.args.wishId,
          actor: parsed.args.creator,
          detail: "planted a new specimen",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index
        }];
      }
      if (name === "Donated") {
        return [{
          kind: name,
          wishId: parsed.args.wishId,
          actor: parsed.args.donor,
          amount: parsed.args.amount,
          detail: "helped it grow",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index
        }];
      }
      if (name === "Withdrawn") {
        return [{
          kind: name,
          wishId: parsed.args.wishId,
          actor: parsed.args.recipient,
          amount: parsed.args.amount,
          detail: "collected funds",
          txHash: log.transactionHash,
          blockNumber: log.blockNumber,
          logIndex: log.index
        }];
      }
      return [{
        kind: name,
        wishId: parsed.args.wishId,
        actor: "",
        detail: "closed to new donations",
        txHash: log.transactionHash,
        blockNumber: log.blockNumber,
        logIndex: log.index
      }];
    });

  return events.sort((a, b) => b.blockNumber - a.blockNumber || b.logIndex - a.logIndex);
}

export function describeWalletError(error: unknown, fallback: string) {
  const message = walletErrorMessage(error);
  const normalized = message?.toLowerCase() ?? "";

  if (message?.includes("Arc Testnet")) return message;
  if (hasWalletErrorCode(error, 4001) || normalized.includes("user rejected")) return "You rejected the wallet request.";
  if (hasWalletErrorCode(error, -32002)) return "MetaMask already has a pending request. Open MetaMask to continue.";
  if (normalized.includes("insufficient funds")) return "Your wallet does not have enough USDC for that action.";
  if (message?.includes("WishClosedErr")) return "That wish has been closed to new donations.";
  if (message?.includes("InsufficientBalance")) return "There are not enough funds left to collect that amount.";
  if (message?.includes("NotRecipient")) return "Only the recipient can collect funds from this wish.";
  if (message?.includes("NotCreator")) return "Only the creator can delete this wish.";
  if (message) return message;
  return fallback;
}
