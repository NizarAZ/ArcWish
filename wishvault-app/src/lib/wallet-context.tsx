import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatUnits, type JsonRpcSigner } from "ethers";
import { describeWalletError, ensureArcTestnet, getBrowserProvider, getReadUsdc, getWalletProvider } from "@/lib/contracts";
import { USDC_DECIMALS } from "@/lib/format";

type WalletContextValue = {
  address?: string;
  balance: bigint;
  balanceLabel: string;
  isConnecting: boolean;
  error?: string;
  connect: () => Promise<string | undefined>;
  disconnect: () => void;
  signer: () => Promise<JsonRpcSigner>;
  refreshBalance: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string>();
  const [balance, setBalance] = useState(0n);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>();

  const signer = useCallback(async () => {
    await ensureArcTestnet();
    const provider = getBrowserProvider();
    const activeSigner = await provider.getSigner();
    const nextAddress = await activeSigner.getAddress();
    setAddress(nextAddress);
    return activeSigner;
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!address) return;
    const usdc = getReadUsdc();
    const nextBalance = await usdc.balanceOf(address);
    setBalance(nextBalance);
  }, [address]);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(undefined);
    try {
      const requestProvider = getBrowserProvider();
      const accounts = await requestProvider.send("eth_requestAccounts", []);
      await ensureArcTestnet();
      const provider = getBrowserProvider();
      const activeSigner = await provider.getSigner();
      const nextAddress = (await activeSigner.getAddress()) || (accounts[0] as string | undefined);
      if (!nextAddress) throw new Error("No wallet account returned.");
      setAddress(nextAddress);
      return nextAddress;
    } catch (connectError) {
      setError(describeWalletError(connectError, "Wallet connection failed."));
      return undefined;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(undefined);
    setBalance(0n);
    setError(undefined);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    void getBrowserProvider()
      .send("eth_accounts", [])
      .then((accounts) => {
        const nextAddress = (accounts as string[] | undefined)?.[0];
        if (nextAddress) setAddress(nextAddress);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;
    const walletProvider = getWalletProvider();
    if (!walletProvider.on) return;
    const onAccountsChanged = (...args: unknown[]) => {
      const accounts = args[0] as string[] | undefined;
      setAddress(accounts?.[0]);
      setBalance(0n);
    };
    const onChainChanged = () => {
      setBalance(0n);
      setError(undefined);
    };
    walletProvider.on("accountsChanged", onAccountsChanged);
    walletProvider.on("chainChanged", onChainChanged);
    return () => {
      walletProvider.removeListener?.("accountsChanged", onAccountsChanged);
      walletProvider.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  useEffect(() => {
    void refreshBalance().catch(() => undefined);
  }, [refreshBalance]);

  const value = useMemo(
    () => ({
      address,
      balance,
      balanceLabel: `${Number(formatUnits(balance, USDC_DECIMALS)).toLocaleString(undefined, {
        maximumFractionDigits: 2
      })} USDC`,
      isConnecting,
      error,
      connect,
      disconnect,
      signer,
      refreshBalance
    }),
    [address, balance, connect, disconnect, error, isConnecting, refreshBalance, signer]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallet must be used within WalletProvider");
  return context;
}
