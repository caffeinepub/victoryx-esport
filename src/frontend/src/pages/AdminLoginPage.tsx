import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Lock, Shield } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

const ADMIN_USERNAME = "VictoryX";
const ADMIN_PASSWORD = "VictoryX@Admin2024";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    // Simulate brief check
    setTimeout(() => {
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        navigate({ to: "/admin" });
      } else {
        setError("Invalid credentials. Access denied.");
        setLoading(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-destructive/5 rounded-full blur-2xl" />
        {/* Grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(oklch(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, oklch(var(--primary)) 1px, transparent 1px)",
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
        {/* Shield icon + title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center relative"
          >
            <Shield size={36} className="text-primary" />
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary animate-pulse" />
          </motion.div>
          <h1 className="font-gaming text-2xl font-extrabold tracking-widest text-foreground">
            ADMIN ACCESS
          </h1>
          <p className="text-xs text-muted-foreground mt-1 tracking-wider">
            RESTRICTED AREA — AUTHORIZED ONLY
          </p>
        </div>

        {/* Login card */}
        <div className="gaming-card rounded-2xl p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-gaming tracking-widest text-muted-foreground">
                USERNAME
              </Label>
              <Input
                data-ocid="admin_login.username_input"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError("");
                }}
                placeholder="Enter admin username"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                className="bg-muted border-border h-11 font-mono text-sm tracking-wider"
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
                  data-ocid="admin_login.password_input"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  placeholder="Enter admin password"
                  autoComplete="current-password"
                  className="bg-muted border-border h-11 pl-9 font-mono text-sm tracking-wider"
                />
              </div>
            </div>

            {/* Error state */}
            {error && (
              <motion.div
                data-ocid="admin_login.error_state"
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
              data-ocid="admin_login.submit_button"
              type="submit"
              disabled={loading || !username || !password}
              className="w-full h-11 font-gaming tracking-widest text-sm bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                  VERIFYING...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Shield size={14} />
                  ENTER ADMIN PANEL
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
