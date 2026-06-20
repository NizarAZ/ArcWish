import { useEffect, useRef, useState } from "react";
import { Activity, ChevronDown, LayoutDashboard, LogOut, Plus, Sprout, Wallet } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CinematicGardenBackground } from "@/components/CinematicGardenBackground";
import { useWallet } from "@/lib/wallet-context";
import { truncateAddress } from "@/lib/format";
import { ARC_TESTNET } from "@/lib/arc-config";
import { cn } from "@/lib/utils";

export function AppShell() {
  const wallet = useWallet();
  const [walletMenuOpen, setWalletMenuOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!walletMenuOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (walletMenuRef.current?.contains(event.target as Node)) return;
      setWalletMenuOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [walletMenuOpen]);

  const navLink = ({ isActive }: { isActive: boolean }) =>
    cn(
      "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard",
      isActive ? "bg-paper text-moss shadow-sm" : "text-moss/75"
    );

  return (
    <div className="relative min-h-screen">
      <CinematicGardenBackground />
      <header className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 border-b border-moss/15 pb-4 md:flex-row md:items-center md:justify-between">
          <Link to="/" className="flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-moss/30 bg-paper">
              <Sprout className="h-5 w-5 text-vine" aria-hidden="true" />
            </span>
            <div>
              <h1 className="font-display text-2xl font-medium leading-tight text-moss">ArcWish</h1>
              <p className="font-mono text-xs text-moss/65">Arc Testnet - Chain {ARC_TESTNET.chainIdDecimal}</p>
            </div>
          </Link>

          <div className="flex flex-wrap items-center gap-2">
            {wallet.address ? (
              <div ref={walletMenuRef} className="relative">
                <button
                  type="button"
                  className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-md border border-moss/20 bg-paper px-3 py-2 font-mono text-xs text-moss transition-colors hover:border-vine hover:bg-glasshouse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                  aria-haspopup="menu"
                  aria-expanded={walletMenuOpen}
                  onClick={() => setWalletMenuOpen((open) => !open)}
                >
                  {truncateAddress(wallet.address)} - {wallet.balanceLabel}
                  <ChevronDown className="h-3.5 w-3.5 text-moss/65" aria-hidden="true" />
                </button>
                {walletMenuOpen ? (
                  <div className="absolute right-0 z-30 mt-2 min-w-48 rounded-md border border-moss/20 bg-paper p-1 shadow-plate" role="menu">
                    <button
                      type="button"
                      className="flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-sm px-3 text-left text-sm font-semibold text-moss transition-colors hover:bg-glasshouse hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard"
                      role="menuitem"
                      onClick={() => {
                        wallet.disconnect();
                        setWalletMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" aria-hidden="true" />
                      Disconnect
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button onClick={wallet.connect} disabled={wallet.isConnecting} variant={wallet.address ? "quiet" : "primary"}>
              <Wallet className="h-4 w-4" aria-hidden="true" />
              {wallet.address ? "Wallet connected" : wallet.isConnecting ? "Opening wallet" : "Connect wallet"}
            </Button>
          </div>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="ArcWish">
          <NavLink to="/" className={navLink} end>
            <Sprout className="h-4 w-4" aria-hidden="true" />
            Explore
          </NavLink>
          <NavLink to="/create" className={navLink}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create
          </NavLink>
          <NavLink to="/dashboard" className={navLink}>
            <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
            Dashboard
          </NavLink>
          <NavLink to="/activity" className={navLink}>
            <Activity className="h-4 w-4" aria-hidden="true" />
            Activity
          </NavLink>
        </nav>
        {wallet.error ? (
          <div className="flex flex-col gap-2 rounded-md border border-clay/30 bg-paper px-3 py-2 text-sm text-moss sm:flex-row sm:items-center sm:justify-between">
            <p>{wallet.error}</p>
            <Button type="button" size="sm" variant="vine" onClick={wallet.connect} disabled={wallet.isConnecting}>
              Retry Arc Testnet
            </Button>
          </div>
        ) : null}
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
