import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, Loader2, Shield, Trophy, Zap } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Gender,
  useSaveProfile,
  useUserProfile,
} from "../hooks/useQueries";
import { storeSessionParameter } from "../utils/urlParams";

export default function AuthPage({ newUser = false }: { newUser?: boolean }) {
  const { login, clear, isLoggingIn, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveProfile();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    gender: "male" as string,
    adminToken: "",
  });
  const [showAdminToken, setShowAdminToken] = useState(false);

  const handleLogin = () => {
    login();
  };

  const handleSetup = async () => {
    if (!form.firstName || !form.username) {
      toast.error("First name and username are required");
      return;
    }
    try {
      // If admin token provided, store it so useActor can use it
      if (form.adminToken.trim()) {
        storeSessionParameter("caffeineAdminToken", form.adminToken.trim());
      }
      await saveProfile.mutateAsync({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        phoneNumbers: form.phone ? [form.phone] : [],
        gender: form.gender as Gender,
        languagePreference: "en",
        walletBalance: BigInt(0),
        transactions: [],
        registeredMatches: [],
      });
      toast.success("Welcome to VictoryX Esport!");
    } catch {
      toast.error("Failed to save profile");
    }
  };

  const showSetup = newUser || (identity && !profile?.firstName);

  if (showSetup) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="font-gaming text-3xl text-gradient-orange">
              VictoryX
            </h1>
            <p className="text-muted-foreground text-sm">
              Complete your profile to start playing
            </p>
          </div>

          <div className="gaming-card rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide">
                FIRST NAME *
              </Label>
              <Input
                data-ocid="auth.firstname_input"
                value={form.firstName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, firstName: e.target.value }))
                }
                placeholder="Enter first name"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide">
                LAST NAME
              </Label>
              <Input
                data-ocid="auth.lastname_input"
                value={form.lastName}
                onChange={(e) =>
                  setForm((p) => ({ ...p, lastName: e.target.value }))
                }
                placeholder="Enter last name"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide">
                USERNAME *
              </Label>
              <Input
                data-ocid="auth.username_input"
                value={form.username}
                onChange={(e) =>
                  setForm((p) => ({ ...p, username: e.target.value }))
                }
                placeholder="Your in-game name"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide">
                PHONE NUMBER
              </Label>
              <Input
                data-ocid="auth.phone_input"
                value={form.phone}
                onChange={(e) =>
                  setForm((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="+880..."
                type="tel"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide">
                GENDER
              </Label>
              <Select
                value={form.gender}
                onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
              >
                <SelectTrigger
                  data-ocid="auth.gender_select"
                  className="bg-muted border-border"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="preferNotToSay">
                    Prefer not to say
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Admin Token Field */}
            <div className="space-y-2">
              <Label className="text-foreground/80 text-sm font-gaming tracking-wide flex items-center gap-1">
                <Shield size={12} className="text-primary" />
                ADMIN TOKEN (optional)
              </Label>
              <div className="relative">
                <Input
                  data-ocid="auth.admin_token_input"
                  value={form.adminToken}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, adminToken: e.target.value }))
                  }
                  type={showAdminToken ? "text" : "password"}
                  placeholder="Enter admin token if you are admin"
                  className="bg-muted border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminToken((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showAdminToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground/60">
                শুধুমাত্র অ্যাডমিনের জন্য — সাধারণ ইউজারদের দরকার নেই
              </p>
            </div>

            <Button
              data-ocid="auth.register_submit_button"
              onClick={handleSetup}
              disabled={saveProfile.isPending}
              className="w-full bg-primary text-primary-foreground font-gaming tracking-widest hover:bg-primary/90 glow-orange"
            >
              {saveProfile.isPending ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                "CREATE ACCOUNT"
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => clear()}
              className="w-full text-muted-foreground text-xs"
            >
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-noise opacity-50" />
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Logo */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 mx-auto animate-glow-pulse">
              <Trophy size={36} className="text-primary" />
            </div>
            <div>
              <h1 className="font-gaming text-4xl font-extrabold text-gradient-orange glow-text-orange tracking-tight">
                VictoryX
              </h1>
              <p className="font-gaming text-sm text-accent tracking-[0.3em] mt-1">
                ESPORT
              </p>
            </div>
            <p className="font-gaming text-muted-foreground tracking-widest text-xs">
              PLAY · WIN · DOMINATE
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Zap, label: "Fast", desc: "Instant matches" },
              { icon: Trophy, label: "Win", desc: "Prize pools" },
              { icon: Shield, label: "Safe", desc: "Secure wallet" },
            ].map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="gaming-card rounded-lg p-3 text-center"
              >
                <Icon size={20} className="text-primary mx-auto mb-1" />
                <p className="font-gaming text-xs text-foreground tracking-wide">
                  {label}
                </p>
                <p className="text-[10px] text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>

          {/* Login */}
          <div className="gaming-card rounded-xl p-6 space-y-4">
            <h2 className="font-gaming text-lg text-center tracking-wider">
              ENTER THE ARENA
            </h2>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Login securely with Internet Identity to access your account
            </p>
            <Button
              data-ocid="auth.login_submit_button"
              onClick={handleLogin}
              disabled={isLoggingIn}
              className="w-full bg-primary text-primary-foreground font-gaming tracking-widest text-base h-12 glow-orange hover:bg-primary/90 transition-all"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={18} />
                  CONNECTING...
                </>
              ) : (
                "LOGIN / REGISTER"
              )}
            </Button>
          </div>
        </motion.div>

        <p className="mt-8 text-xs text-muted-foreground text-center">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href="https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=victoryxesport"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </div>
  );
}
