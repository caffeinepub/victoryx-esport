import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, Flame, Swords, Target, Trophy } from "lucide-react";
import { motion } from "motion/react";

const CATEGORIES = [
  {
    key: "BattleRoyale",
    label: "BattleR",
    sublabel: "Battle Royale",
    desc: "50-player island survival battle",
    icon: Flame,
    gradient: "from-orange-900/60 to-red-900/30",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
    ocid: "tournament.battleroyal_card",
  },
  {
    key: "ClashSquad",
    label: "Clash Sq",
    sublabel: "Clash Squad",
    desc: "4v4 rapid squad battles",
    icon: Swords,
    gradient: "from-blue-900/60 to-cyan-900/30",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    ocid: "tournament.clashsquad_card",
  },
  {
    key: "LoneWolf",
    label: "Lone Wolf",
    sublabel: "Solo Mode",
    desc: "1v1 intense duels",
    icon: Target,
    gradient: "from-purple-900/60 to-violet-900/30",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
    ocid: "tournament.lonewolf_card",
  },
  {
    key: "other",
    label: "Others",
    sublabel: "Special Events",
    desc: "Unique limited-time modes",
    icon: Trophy,
    gradient: "from-emerald-900/60 to-green-900/30",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    ocid: "tournament.other_card",
  },
];

export default function TournamentsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-8 pb-4">
        <div className="h-1 w-12 bg-primary rounded-full mb-3" />
        <h1 className="font-gaming text-3xl font-extrabold tracking-tight">
          ARENA
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Choose your battlefield
        </p>
      </header>

      <div className="px-4 space-y-3">
        {CATEGORIES.map(
          (
            {
              key,
              label,
              sublabel,
              desc,
              icon: Icon,
              gradient,
              border,
              iconColor,
              ocid,
            },
            i,
          ) => (
            <motion.button
              key={key}
              type="button"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              data-ocid={ocid}
              onClick={() =>
                navigate({
                  to: "/tournaments/$category",
                  params: { category: key },
                })
              }
              className={`w-full gaming-card rounded-xl p-4 bg-gradient-to-r ${gradient} border ${border} text-left transition-all active:scale-[0.99] hover:brightness-110`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex-shrink-0 w-14 h-14 rounded-xl bg-background/40 border ${border} flex items-center justify-center ${iconColor}`}
                >
                  <Icon size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-gaming text-xl font-bold text-foreground">
                      {label}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full bg-background/40 ${iconColor} font-gaming tracking-wide border ${border}`}
                    >
                      {sublabel}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{desc}</p>
                </div>
                <ChevronRight
                  size={20}
                  className="text-muted-foreground flex-shrink-0"
                />
              </div>
            </motion.button>
          ),
        )}
      </div>
    </div>
  );
}
