import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Flame,
  Globe,
  MessageCircle,
  Share2,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import LanguageModal from "../components/LanguageModal";
import { useSaveProfile, useUserProfile } from "../hooks/useQueries";

const CATEGORIES = [
  {
    key: "BattleRoyale",
    label: "BattleR",
    sublabel: "Battle Royale",
    icon: Flame,
    gradient: "from-orange-900/60 to-red-900/40",
    border: "border-orange-500/30",
    iconColor: "text-orange-400",
    glowColor: "hover:shadow-[0_0_20px_oklch(65%_0.2_30/0.3)]",
  },
  {
    key: "ClashSquad",
    label: "Clash Sq",
    sublabel: "Clash Squad",
    icon: Swords,
    gradient: "from-blue-900/60 to-cyan-900/40",
    border: "border-blue-500/30",
    iconColor: "text-blue-400",
    glowColor: "hover:shadow-[0_0_20px_oklch(62%_0.22_220/0.3)]",
  },
  {
    key: "LoneWolf",
    label: "Lone Wolf",
    sublabel: "Solo Mode",
    icon: Target,
    gradient: "from-purple-900/60 to-violet-900/40",
    border: "border-purple-500/30",
    iconColor: "text-purple-400",
    glowColor: "hover:shadow-[0_0_20px_oklch(62%_0.22_300/0.3)]",
  },
  {
    key: "other",
    label: "Others",
    sublabel: "Special Events",
    icon: Trophy,
    gradient: "from-emerald-900/60 to-green-900/40",
    border: "border-emerald-500/30",
    iconColor: "text-emerald-400",
    glowColor: "hover:shadow-[0_0_20px_oklch(65%_0.2_160/0.3)]",
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveProfile();

  const handleSupport = () => {
    window.open("https://t.me/Flashhhhhhhhhhhhhhhhhhhhhhhhhhh", "_blank");
  };

  const handleShare = async () => {
    const shareData = {
      title: "VictoryX Esport - Free Fire Tournament",
      text: "Join VictoryX Esport for exciting Free Fire tournaments!",
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.origin);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleLanguageSelect = async (lang: string) => {
    if (!profile) return;
    try {
      await saveProfile.mutateAsync({ ...profile, languagePreference: lang });
      toast.success("Language updated!");
    } catch {
      toast.error("Failed to update language");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/15 via-background/50 to-background" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
        <div className="relative z-10 px-4 pt-8 pb-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/20 border border-primary/30 rounded-full px-3 py-1 mb-3">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="font-gaming text-primary text-xs tracking-[0.2em]">
                LIVE TOURNAMENTS
              </span>
            </div>
            <h1 className="font-gaming text-4xl font-extrabold text-gradient-orange glow-text-orange leading-tight">
              VictoryX
            </h1>
            <p className="font-gaming text-accent text-sm tracking-[0.4em] mt-1">
              ESPORT
            </p>
            <p className="font-gaming text-muted-foreground tracking-widest text-xs mt-3">
              PLAY · WIN · DOMINATE
            </p>
          </motion.div>
        </div>
      </header>

      <div className="px-4 pb-4 space-y-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="gaming-card rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Welcome back,</p>
              <p className="font-gaming text-xl font-bold text-foreground">
                {profile?.username || "Player"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">Balance</p>
              <p className="font-mono text-primary text-lg font-bold">
                ৳{Number(profile?.walletBalance ?? 0).toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground uppercase">
              Tournaments
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {CATEGORIES.map(
              (
                {
                  key,
                  label,
                  sublabel,
                  icon: Icon,
                  gradient,
                  border,
                  iconColor,
                  glowColor,
                },
                i,
              ) => (
                <motion.button
                  key={key}
                  type="button"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.08 }}
                  data-ocid={`tournament.${key.toLowerCase().replace("battleroyale", "battleroyal")}_card`}
                  onClick={() =>
                    navigate({
                      to: "/tournaments/$category",
                      params: { category: key },
                    })
                  }
                  className={`gaming-card rounded-xl p-4 text-left bg-gradient-to-br ${gradient} border ${border} transition-all duration-200 ${glowColor} active:scale-95`}
                >
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-background/50 mb-3 ${iconColor}`}
                  >
                    <Icon size={22} />
                  </div>
                  <p className="font-gaming text-base font-bold text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {sublabel}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    <span className="text-[10px] text-muted-foreground/70 font-gaming tracking-wide">
                      VIEW
                    </span>
                    <ChevronRight
                      size={10}
                      className="text-muted-foreground/70"
                    />
                  </div>
                </motion.button>
              ),
            )}
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground uppercase mb-3">
            Quick Actions
          </h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              data-ocid="home.customer_support_button"
              onClick={handleSupport}
              className="gaming-card rounded-xl p-4 text-center transition-all hover:bg-accent/10 active:scale-95 group"
            >
              <MessageCircle
                size={24}
                className="text-accent mx-auto mb-2 group-hover:scale-110 transition-transform"
              />
              <p className="font-gaming text-xs tracking-wide text-foreground">
                Support
              </p>
            </button>
            <button
              type="button"
              data-ocid="home.share_button"
              onClick={handleShare}
              className="gaming-card rounded-xl p-4 text-center transition-all hover:bg-primary/10 active:scale-95 group"
            >
              <Share2
                size={24}
                className="text-primary mx-auto mb-2 group-hover:scale-110 transition-transform"
              />
              <p className="font-gaming text-xs tracking-wide text-foreground">
                Share
              </p>
            </button>
            <button
              type="button"
              data-ocid="home.language_button"
              onClick={() => setLangOpen(true)}
              className="gaming-card rounded-xl p-4 text-center transition-all hover:bg-chart-3/10 active:scale-95 group"
            >
              <Globe
                size={24}
                className="text-chart-3 mx-auto mb-2 group-hover:scale-110 transition-transform"
              />
              <p className="font-gaming text-xs tracking-wide text-foreground">
                Language
              </p>
            </button>
          </div>
        </motion.section>

        <footer className="text-center pt-2 pb-4">
          <p className="text-xs text-muted-foreground/50">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/60 hover:text-primary"
            >
              caffeine.ai
            </a>
          </p>
        </footer>
      </div>

      <LanguageModal
        open={langOpen}
        onOpenChange={setLangOpen}
        current={profile?.languagePreference || "en"}
        onSelect={handleLanguageSelect}
      />
    </div>
  );
}
