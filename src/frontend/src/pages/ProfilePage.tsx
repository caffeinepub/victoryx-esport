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
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Edit3,
  Globe,
  Lock,
  LogOut,
  MessageCircle,
  Phone,
  Save,
  Shield,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import LanguageModal from "../components/LanguageModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type Gender,
  useSaveProfile,
  useUserProfile,
} from "../hooks/useQueries";
import { useTranslation } from "../hooks/useTranslation";

export default function ProfilePage() {
  const { clear, identity } = useInternetIdentity();
  const { data: profile } = useUserProfile();
  const saveProfile = useSaveProfile();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    gender: "male",
  });

  useEffect(() => {
    setEditing(false);
  }, []);

  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName,
        lastName: profile.lastName,
        username: profile.username,
        phone: profile.phoneNumbers[0] || "",
        gender: profile.gender,
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    try {
      await saveProfile.mutateAsync({
        ...profile,
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        phoneNumbers: form.phone ? [form.phone] : profile.phoneNumbers,
        gender: form.gender as Gender,
      });
      toast.success("Profile updated!");
      setEditing(false);
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const handleLanguageSelect = async (lang: string) => {
    if (!profile) return;
    await saveProfile.mutateAsync({ ...profile, languagePreference: lang });
    toast.success("Language updated!");
  };

  const initials = profile
    ? `${profile.firstName[0] || "?"}${profile.lastName[0] || ""}`.toUpperCase()
    : "?";
  const principal = identity?.getPrincipal().toString();

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-8 pb-4">
        <div className="h-1 w-12 bg-primary rounded-full mb-3" />
        <h1 className="font-gaming text-3xl font-extrabold tracking-tight">
          {t("profile")}
        </h1>
      </header>

      <div className="px-4 space-y-4">
        {/* Avatar + name */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-2xl p-5 flex items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/20 border-2 border-primary/40 flex items-center justify-center flex-shrink-0">
            <span className="font-gaming text-2xl font-bold text-primary">
              {initials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-gaming text-xl font-bold">
              {profile?.firstName} {profile?.lastName}
            </p>
            <p className="text-sm text-muted-foreground">
              @{profile?.username}
            </p>
            {principal && (
              <p className="font-mono text-[10px] text-muted-foreground/50 mt-1 truncate">
                {principal.slice(0, 20)}...
              </p>
            )}
          </div>
        </motion.div>

        {/* Profile details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gaming-card rounded-xl p-4 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-gaming text-sm tracking-widest text-muted-foreground">
              {t("personal_info")}
            </h2>
            {!editing ? (
              <Button
                data-ocid="profile.edit_button"
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="text-primary h-7 text-xs font-gaming tracking-wide"
              >
                <Edit3 size={12} className="mr-1" />
                {t("edit")}
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  data-ocid="profile.save_button"
                  size="sm"
                  onClick={handleSave}
                  disabled={saveProfile.isPending}
                  className="bg-primary text-primary-foreground h-7 text-xs font-gaming"
                >
                  <Save size={12} className="mr-1" />
                  {t("save")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(false)}
                  className="h-7 text-xs"
                >
                  <X size={12} />
                </Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-gaming tracking-wide">
                    {t("first_name")}
                  </Label>
                  <Input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, firstName: e.target.value }))
                    }
                    className="bg-muted border-border h-9 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground font-gaming tracking-wide">
                    {t("last_name")}
                  </Label>
                  <Input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, lastName: e.target.value }))
                    }
                    className="bg-muted border-border h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-gaming tracking-wide">
                  {t("username")}
                </Label>
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, username: e.target.value }))
                  }
                  className="bg-muted border-border h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-gaming tracking-wide">
                  {t("phone")}
                </Label>
                <Input
                  value={form.phone}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, phone: e.target.value }))
                  }
                  className="bg-muted border-border h-9 text-sm"
                  type="tel"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground font-gaming tracking-wide">
                  {t("gender")}
                </Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => setForm((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger className="bg-muted border-border h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="male">{t("male")}</SelectItem>
                    <SelectItem value="female">{t("female")}</SelectItem>
                    <SelectItem value="other">{t("other")}</SelectItem>
                    <SelectItem value="preferNotToSay">
                      {t("prefer_not_to_say")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { labelKey: "first_name" as const, value: profile?.firstName },
                { labelKey: "last_name" as const, value: profile?.lastName },
                {
                  labelKey: "username" as const,
                  value: `@${profile?.username}`,
                },
                { labelKey: "gender" as const, value: profile?.gender },
              ].map(({ labelKey, value }) => (
                <div
                  key={labelKey}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-xs text-muted-foreground font-gaming tracking-wide">
                    {t(labelKey)}
                  </span>
                  <span className="text-sm text-foreground font-medium">
                    {value || "—"}
                  </span>
                </div>
              ))}
              {(profile?.phoneNumbers || []).length > 0 && (
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-muted-foreground font-gaming tracking-wide flex items-center gap-1">
                    <Phone size={10} />
                    {t("phones")}
                  </span>
                  <div className="text-right">
                    {profile?.phoneNumbers.map((p) => (
                      <p key={p} className="text-sm">
                        {p}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Reset Password */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="gaming-card rounded-xl overflow-hidden"
        >
          <button
            type="button"
            data-ocid="profile.reset_password_button"
            onClick={() => setShowReset((v) => !v)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <Lock size={18} className="text-muted-foreground" />
            <span className="font-gaming tracking-wide text-sm flex-1 text-left">
              {t("reset_password")}
            </span>
            <ChevronRight
              size={16}
              className={`text-muted-foreground transition-transform ${showReset ? "rotate-90" : ""}`}
            />
          </button>
          {showReset && (
            <div className="px-4 pb-4 space-y-3">
              <Separator className="bg-border" />
              <p className="text-xs text-muted-foreground">
                {t("reset_password_info")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="border-border"
                onClick={() =>
                  toast.info(
                    "Please use Internet Identity to manage your credentials",
                  )
                }
              >
                {t("manage_via_ii")}
              </Button>
            </div>
          )}
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gaming-card rounded-xl overflow-hidden"
        >
          <button
            type="button"
            onClick={() =>
              window.open(
                "https://t.me/Flashhhhhhhhhhhhhhhhhhhhhhhhhhh",
                "_blank",
              )
            }
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <MessageCircle size={18} className="text-accent" />
            <span className="font-gaming tracking-wide text-sm flex-1 text-left">
              {t("customer_support")}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
          <Separator className="bg-border mx-4" />
          <button
            type="button"
            onClick={() => setLangOpen(true)}
            className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
          >
            <Globe size={18} className="text-chart-3" />
            <span className="font-gaming tracking-wide text-sm flex-1 text-left">
              {t("change_language")}
            </span>
            <span className="text-xs text-muted-foreground mr-2">
              {profile?.languagePreference?.toUpperCase() || "EN"}
            </span>
            <ChevronRight size={16} className="text-muted-foreground" />
          </button>
        </motion.div>

        {/* Admin Login Button — visible to all users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
        >
          <Button
            data-ocid="profile.admin_login_button"
            variant="outline"
            onClick={() => navigate({ to: "/vx-secure-admin" })}
            className="w-full border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-gaming tracking-widest"
          >
            <Shield size={16} className="mr-2" />
            ADMIN LOGIN
          </Button>
        </motion.div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            data-ocid="profile.logout_button"
            variant="outline"
            onClick={() => clear()}
            className="w-full border-destructive/40 text-destructive hover:bg-destructive/10 font-gaming tracking-widest"
          >
            <LogOut size={16} className="mr-2" />
            {t("logout")}
          </Button>
        </motion.div>

        <footer className="text-center pb-4">
          <p className="text-xs text-muted-foreground/40">
            © {new Date().getFullYear()}. Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary/50"
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
