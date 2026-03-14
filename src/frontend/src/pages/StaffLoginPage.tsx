import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, Lock, UserCog } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

export const STAFF_SESSION_KEY = "vx_staff_session";
export const STAFF_LIST_KEY = "vx_staff_list";

export type StaffMode =
  | "all"
  | "BattleRoyale"
  | "ClashSquad"
  | "LoneWolf"
  | "other";

export interface StaffMember {
  id: string;
  name: string;
  username: string;
  password: string;
  mode: StaffMode;
}

export const MODE_LABELS: Record<StaffMode, string> = {
  all: "All Modes",
  BattleRoyale: "Battle Royale",
  ClashSquad: "Clash Squad",
  LoneWolf: "Lone Wolf",
  other: "Others",
};

export const MODE_URL_MAP: Record<string, StaffMode> = {
  "/vx-staff": "all",
  "/vx-staff-br": "BattleRoyale",
  "/vx-staff-cs": "ClashSquad",
  "/vx-staff-lw": "LoneWolf",
  "/vx-staff-ot": "other",
};

export function getStaffList(): StaffMember[] {
  try {
    const stored = localStorage.getItem(STAFF_LIST_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored) as StaffMember[];
    // Migration: add mode field if missing
    return parsed.map((s) => ({ ...s, mode: (s.mode ?? "all") as StaffMode }));
  } catch {
    return [];
  }
}

export default function StaffLoginPage() {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const urlMode: StaffMode = MODE_URL_MAP[currentPath] ?? "all";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTimeout(() => {
      const staffList = getStaffList();
      // Find staff matching username+password.
      // Mode restriction: staff can login if their assigned mode matches the URL mode,
      // OR if either side is "all" (any URL works for "all" mode staff, and /vx-staff works for any staff).
      const staff = staffList.find(
        (s) =>
          s.username === username &&
          s.password === password &&
          (urlMode === "all" || // /vx-staff accepts anyone
            s.mode === "all" || // "all" mode staff can login anywhere
            s.mode === urlMode), // exact mode match
      );
      if (staff) {
        // Save session with the staff's actual assigned mode
        localStorage.setItem(
          STAFF_SESSION_KEY,
          JSON.stringify({
            username: staff.username,
            name: staff.name,
            mode: staff.mode, // use staff's own mode, not URL mode
          }),
        );
        navigate({ to: "/staff-panel" });
      } else {
        setError("Invalid credentials. Access denied.");
        setLoading(false);
      }
    }, 600);
  };

  const urlModeLabel = MODE_LABELS[urlMode];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600/5 rounded-full blur-2xl" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgb(34 211 238 / 0.5) 1px, transparent 1px), linear-gradient(90deg, rgb(34 211 238 / 0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-cyan-500/10 border-2 border-cyan-500/30 flex items-center justify-center relative"
          >
            <UserCog size={36} className="text-cyan-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
          </motion.div>
          <h1 className="font-gaming text-2xl font-extrabold tracking-widest text-foreground">
            STAFF ACCESS
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider">
            {urlModeLabel.toUpperCase()} — AUTHORIZED ONLY
          </p>
        </div>

        <div className="gaming-card rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-gaming tracking-widest text-muted-foreground">
                USERNAME
              </Label>
              <Input
                data-ocid="staff_login.input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter staff username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="bg-muted border-cyan-500/30 h-11 font-mono text-sm tracking-wider focus-visible:ring-cyan-500/40"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-gaming tracking-widest text-muted-foreground">
                PASSWORD
              </Label>
              <div className="relative">
                <Lock
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  data-ocid="staff_login.password_input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter staff password"
                  autoComplete="current-password"
                  className="bg-muted border-cyan-500/30 h-11 pl-9 font-mono text-sm tracking-wider focus-visible:ring-cyan-500/40"
                />
              </div>
            </div>

            {error && (
              <motion.div
                data-ocid="staff_login.error_state"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2"
              >
                <AlertTriangle
                  size={14}
                  className="text-destructive flex-shrink-0"
                />
                <p className="text-xs text-destructive font-gaming tracking-wide">
                  {error}
                </p>
              </motion.div>
            )}

            <Button
              data-ocid="staff_login.submit_button"
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 font-gaming tracking-widest text-sm bg-cyan-600 hover:bg-cyan-500 text-white"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  VERIFYING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <UserCog size={14} />
                  ENTER STAFF PANEL
                </span>
              )}
            </Button>
          </form>

          <p className="text-center text-[10px] text-muted-foreground/40 font-gaming tracking-wider">
            ALL ACCESS ATTEMPTS ARE LOGGED
          </p>
        </div>
      </motion.div>
    </div>
  );
}
