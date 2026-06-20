import { useCallback, useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/AppShell";
import { WalletProvider } from "@/lib/wallet-context";
import { loadActivity, loadWishes, type ActivityItem, type Wish } from "@/lib/contracts";
import { ActivityPage } from "@/pages/ActivityPage";
import { CreateWish } from "@/pages/CreateWish";
import { Dashboard } from "@/pages/Dashboard";
import { Explore } from "@/pages/Explore";
import { GrowthDev } from "@/pages/GrowthDev";
import { WishDetail } from "@/pages/WishDetail";

function AppRoutes() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const nextWishes = await loadWishes();
      setWishes(nextWishes);
      try {
        const visibleWishIds = new Set(nextWishes.map((wish) => wish.id.toString()));
        const nextActivity = await loadActivity();
        setActivity(nextActivity.filter((item) => visibleWishIds.has(item.wishId.toString())));
      } catch {
        setActivity([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh().catch(() => undefined);
  }, [refresh]);

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Explore wishes={wishes} activity={activity} isLoading={isLoading} />} />
        <Route path="/dev/growth" element={<GrowthDev />} />
        <Route path="/create" element={<CreateWish onConfirmed={refresh} />} />
        <Route path="/wish/:id" element={<WishDetail wishes={wishes} activity={activity} onConfirmed={refresh} />} />
        <Route path="/dashboard" element={<Dashboard wishes={wishes} activity={activity} onConfirmed={refresh} />} />
        <Route path="/activity" element={<ActivityPage wishes={wishes} activity={activity} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <AppRoutes />
    </WalletProvider>
  );
}
