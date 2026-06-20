export const ARC_TESTNET = {
  chainIdDecimal: 5042002,
  chainId: "0x4cef52",
  chainName: "Arc Testnet",
  rpcUrls: ["https://rpc.testnet.arc.network"],
  blockExplorerUrls: ["https://testnet.arcscan.app"],
  nativeCurrency: {
    name: "USDC",
    symbol: "USDC",
    decimals: 18
  }
} as const;

export const ARC_TESTNET_WALLET_PARAMS = {
  chainId: ARC_TESTNET.chainId,
  chainName: ARC_TESTNET.chainName,
  rpcUrls: ARC_TESTNET.rpcUrls,
  blockExplorerUrls: ARC_TESTNET.blockExplorerUrls,
  nativeCurrency: ARC_TESTNET.nativeCurrency
} as const;

export const ARC_EXPLORER = "https://testnet.arcscan.app";
export const ARC_RPC = "https://rpc.testnet.arc.network";
export const ARC_USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
export const WISH_REGISTRY_ADDRESS = import.meta.env.VITE_WISH_REGISTRY_ADDRESS as string | undefined;
export const WISH_REGISTRY_DEPLOY_BLOCK = 47790882;
export const PINATA_JWT = import.meta.env.VITE_PINATA_JWT as string | undefined;
export const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY as string | undefined;
