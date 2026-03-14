import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import BottomNav from "./components/BottomNav";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useUserProfile } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import AuthPage from "./pages/AuthPage";
import CategoryPage from "./pages/CategoryPage";
import HomePage from "./pages/HomePage";
import MyMatchesPage from "./pages/MyMatchesPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentsPage from "./pages/TournamentsPage";
import WalletPage from "./pages/WalletPage";

function AppShell() {
  const { identity, isInitializing } = useInternetIdentity();
  const { data: profile, isLoading } = useUserProfile();

  if (isInitializing || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-2 border-primary rounded-full animate-spin border-t-transparent" />
          <p className="font-gaming text-primary text-lg tracking-widest">
            LOADING...
          </p>
        </div>
      </div>
    );
  }

  if (!identity) {
    return <AuthPage />;
  }

  if (!profile?.firstName) {
    return <AuthPage newUser />;
  }

  return (
    <div className="min-h-screen bg-background relative">
      <div className="scan-line fixed inset-0 pointer-events-none z-0" />
      <main className="relative z-10 bottom-nav-safe">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}

const rootRoute = createRootRoute({
  component: AppShell,
});

const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: HomePage,
});

const tournamentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tournaments",
  component: TournamentsPage,
});

const categoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tournaments/$category",
  component: CategoryPage,
});

const myMatchesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/my-matches",
  component: MyMatchesPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const routeTree = rootRoute.addChildren([
  homeRoute,
  tournamentsRoute,
  categoryRoute,
  myMatchesRoute,
  walletRoute,
  profileRoute,
  adminRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster richColors theme="dark" />
    </>
  );
}
