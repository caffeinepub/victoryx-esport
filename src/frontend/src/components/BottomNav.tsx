import { cn } from "@/lib/utils";
import { Link, useLocation } from "@tanstack/react-router";
import { Crosshair, Home, Trophy, User, Wallet } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home, ocid: "nav.home_link" },
  {
    to: "/tournaments",
    label: "Arena",
    icon: Trophy,
    ocid: "nav.tournaments_link",
  },
  {
    to: "/my-matches",
    label: "Matches",
    icon: Crosshair,
    ocid: "nav.mymatches_link",
  },
  { to: "/wallet", label: "Wallet", icon: Wallet, ocid: "nav.wallet_link" },
  { to: "/profile", label: "Profile", icon: User, ocid: "nav.profile_link" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[oklch(9%_0.018_255)] border-t border-border">
      <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map(({ to, label, icon: Icon, ocid }) => {
          const isActive =
            to === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              data-ocid={ocid}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg transition-all duration-200 min-w-[56px]",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div
                className={cn(
                  "p-1.5 rounded-lg transition-all duration-200",
                  isActive && "bg-primary/15 shadow-glow-sm",
                )}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-gaming tracking-wider uppercase",
                  isActive ? "text-primary" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
