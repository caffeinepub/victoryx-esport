import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  Flame,
  SearchX,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import {
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  useMatchesByCategory,
} from "../hooks/useQueries";

const CATEGORY_META: Record<
  string,
  {
    label: string;
    sublabel: string;
    icon: typeof Flame;
    iconColor: string;
    gradient: string;
  }
> = {
  BattleRoyale: {
    label: "BattleR",
    sublabel: "Battle Royale",
    icon: Flame,
    iconColor: "text-orange-400",
    gradient: "from-orange-900/20",
  },
  ClashSquad: {
    label: "Clash Sq",
    sublabel: "Clash Squad",
    icon: Swords,
    iconColor: "text-blue-400",
    gradient: "from-blue-900/20",
  },
  LoneWolf: {
    label: "Lone Wolf",
    sublabel: "Solo Mode",
    icon: Target,
    iconColor: "text-purple-400",
    gradient: "from-purple-900/20",
  },
  other: {
    label: "Others",
    sublabel: "Special Events",
    icon: Trophy,
    iconColor: "text-emerald-400",
    gradient: "from-emerald-900/20",
  },
};

export default function CategoryPage() {
  const { category } = useParams({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const validCategory =
    category && CATEGORY_META[category]
      ? (category as Variant_BattleRoyale_other_ClashSquad_LoneWolf)
      : Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale;
  const { data: matches, isLoading } = useMatchesByCategory(validCategory);
  const meta =
    CATEGORY_META[category || "BattleRoyale"] || CATEGORY_META.BattleRoyale;
  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`bg-gradient-to-b ${meta.gradient} to-transparent px-4 pt-6 pb-4`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/tournaments" })}
          className="mb-3 -ml-2 text-muted-foreground"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-background/40 flex items-center justify-center ${meta.iconColor}`}
          >
            <Icon size={26} />
          </div>
          <div>
            <h1 className="font-gaming text-2xl font-extrabold">
              {meta.label}
            </h1>
            <p className="text-muted-foreground text-sm">{meta.sublabel}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        ) : !matches || matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="matches.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <SearchX size={56} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-gaming text-xl text-muted-foreground">
              No Live Match Found
            </h3>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Check back soon for upcoming tournaments
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => (
              <motion.div
                key={match.id.toString()}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="gaming-card rounded-xl p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-gaming text-base font-bold">
                      {match.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {match.mode}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-gaming tracking-wide ${
                      match.status === "live"
                        ? "bg-green-500/20 text-green-400"
                        : match.status === "upcoming"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {String(match.status).toUpperCase()}
                  </span>
                </div>
                <div className="flex gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      ENTRY FEE
                    </p>
                    <p className="font-mono text-sm text-primary">
                      ৳{Number(match.entryFee)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">
                      PRIZE POOL
                    </p>
                    <p className="font-mono text-sm text-chart-3">
                      ৳{Number(match.prizePool)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">SLOTS</p>
                    <p className="font-mono text-sm">
                      {Number(match.filledSlots)}/{Number(match.maxSlots)}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
