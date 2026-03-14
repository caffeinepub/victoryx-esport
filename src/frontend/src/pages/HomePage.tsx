import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Copy,
  Flame,
  Globe,
  MessageCircle,
  Send,
  Share2,
  Swords,
  Target,
  Trophy,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import LanguageModal from "../components/LanguageModal";
import { useSaveProfile, useUserProfile } from "../hooks/useQueries";
import { useTranslation } from "../hooks/useTranslation";

const APP_URL = window.location.origin;
const APP_TEXT =
  "🎮 Join VictoryX Esport for exciting Free Fire tournaments! Compete, win, and dominate!";

const SHARE_PLATFORMS = [
  {
    name: "WhatsApp",
    color:
      "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg",
    getUrl: () =>
      `https://wa.me/?text=${encodeURIComponent(`${APP_TEXT}\n${APP_URL}`)}`,
  },
  {
    name: "Telegram",
    color:
      "bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/8/82/Telegram_logo.svg",
    getUrl: () =>
      `https://t.me/share/url?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(APP_TEXT)}`,
  },
  {
    name: "Instagram",
    color:
      "bg-pink-500/20 border-pink-500/40 text-pink-400 hover:bg-pink-500/30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/a/a5/Instagram_icon.png",
    getUrl: () => null, // Instagram doesn't support direct URL share; copy link instead
  },
  {
    name: "Facebook",
    color:
      "bg-indigo-500/20 border-indigo-500/40 text-indigo-400 hover:bg-indigo-500/30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    getUrl: () =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(APP_URL)}`,
  },
  {
    name: "Twitter/X",
    color:
      "bg-gray-500/20 border-gray-500/40 text-gray-300 hover:bg-gray-500/30",
    icon: "https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg",
    getUrl: () =>
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(APP_URL)}&text=${encodeURIComponent(APP_TEXT)}`,
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [langOpen, setLangOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveProfile();
  const { t } = useTranslation();

  const CATEGORIES = [
    {
      key: "BattleRoyale",
      label: t("battle_royale"),
      sublabel: t("sq50_survival"),
      icon: Flame,
      gradient: "from-orange-900/60 to-red-900/40",
      border: "border-orange-500/30",
      iconColor: "text-orange-400",
      glowColor: "hover:shadow-[0_0_20px_oklch(65%_0.2_30/0.3)]",
    },
    {
      key: "ClashSquad",
      label: t("clash_squad"),
      sublabel: t("squad_4v4"),
      icon: Swords,
      gradient: "from-blue-900/60 to-cyan-900/40",
      border: "border-blue-500/30",
      iconColor: "text-blue-400",
      glowColor: "hover:shadow-[0_0_20px_oklch(62%_0.22_220/0.3)]",
    },
    {
      key: "LoneWolf",
      label: t("lone_wolf"),
      sublabel: t("solo_1v1"),
      icon: Target,
      gradient: "from-purple-900/60 to-violet-900/40",
      border: "border-purple-500/30",
      iconColor: "text-purple-400",
      glowColor: "hover:shadow-[0_0_20px_oklch(62%_0.22_300/0.3)]",
    },
    {
      key: "other",
      label: t("others"),
      sublabel: t("unique_modes"),
      icon: Trophy,
      gradient: "from-emerald-900/60 to-green-900/40",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-400",
      glowColor: "hover:shadow-[0_0_20px_oklch(65%_0.2_160/0.3)]",
    },
  ];

  const handleSupport = () => {
    window.open("https://t.me/Flashhhhhhhhhhhhhhhhhhhhhhhhhhh", "_blank");
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  const handlePlatformShare = (platform: (typeof SHARE_PLATFORMS)[0]) => {
    const url = platform.getUrl();
    if (url) {
      window.open(url, "_blank");
    } else {
      // Instagram — copy link
      navigator.clipboard
        .writeText(`${APP_TEXT}\n${APP_URL}`)
        .then(() => toast.success("Link copied! Paste it on Instagram."))
        .catch(() => toast.error("Failed to copy"));
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(APP_URL)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Failed to copy"));
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
                {t("live_tournaments")}
              </span>
            </div>
            <h1 className="font-gaming text-4xl font-extrabold text-gradient-orange glow-text-orange leading-tight">
              VictoryX
            </h1>
            <p className="font-gaming text-accent text-sm tracking-[0.4em] mt-1">
              ESPORT
            </p>
            <p className="font-gaming text-muted-foreground tracking-widest text-xs mt-3">
              {t("play_win_dominate")}
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
              <p className="text-muted-foreground text-sm">
                {t("welcome_back")}
              </p>
              <p className="font-gaming text-xl font-bold text-foreground">
                {profile?.username || "Player"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-xs">{t("balance")}</p>
              <p className="font-mono text-primary text-lg font-bold">
                ₹{Number(profile?.walletBalance ?? 0).toFixed(0)}
              </p>
            </div>
          </div>
        </motion.div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground uppercase">
              {t("tournaments")}
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
                      {t("view")}
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
            {t("quick_actions")}
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
                {t("support")}
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
                {t("share")}
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
                {t("language")}
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

      {/* Share Dialog */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent
          data-ocid="share.dialog"
          className="bg-background border-border max-w-sm"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-gaming tracking-widest text-primary flex items-center gap-2">
                <Share2 size={16} />
                SHARE APP
              </DialogTitle>
              <Button
                data-ocid="share.close_button"
                variant="ghost"
                size="sm"
                onClick={() => setShareOpen(false)}
                className="h-7 w-7 p-0"
              >
                <X size={14} />
              </Button>
            </div>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground font-gaming tracking-wide">
              SELECT PLATFORM TO SHARE
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SHARE_PLATFORMS.map((platform) => (
                <button
                  key={platform.name}
                  type="button"
                  data-ocid={`share.${platform.name.toLowerCase().replace("/", "_")}_button`}
                  onClick={() => handlePlatformShare(platform)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border font-gaming text-xs tracking-wide transition-all active:scale-95 ${platform.color}`}
                >
                  <img
                    src={platform.icon}
                    alt={platform.name}
                    className="w-5 h-5 rounded object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  {platform.name === "Instagram" ? (
                    <span className="flex items-center gap-1">
                      {platform.name}
                      <Copy size={10} className="opacity-60" />
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      {platform.name}
                      <Send size={10} className="opacity-60" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground font-gaming">
                OR
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button
              data-ocid="share.copy_link_button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="w-full border-border font-gaming tracking-widest text-xs gap-2"
            >
              <Copy size={13} />
              COPY LINK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
