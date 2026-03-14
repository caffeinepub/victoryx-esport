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
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle,
  Loader2,
  Plus,
  Shield,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_upcoming_live_completed } from "../backend.d";
import {
  type TournamentMatch,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  useAddMatch,
  useApprovePayment,
  useIsAdmin,
  useTransactionHistory,
} from "../hooks/useQueries";

export default function AdminPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const addMatch = useAddMatch();
  const approvePayment = useApprovePayment();
  const { data: transactions } = useTransactionHistory();

  const pendingTx = (transactions || []).filter(
    (tx) => tx.status === "pending" && tx.transactionType === "deposit",
  );

  const [form, setForm] = useState({
    title: "",
    category: Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale,
    mode: "",
    entryFee: "",
    prizePool: "",
    maxSlots: "",
    scheduledTime: "",
  });

  const handleAddMatch = async () => {
    if (!form.title || !form.mode || !form.entryFee || !form.maxSlots) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      const match: TournamentMatch = {
        id: BigInt(Date.now()),
        title: form.title,
        category: form.category,
        mode: form.mode,
        entryFee: BigInt(Number(form.entryFee)),
        prizePool: BigInt(Number(form.prizePool) || 0),
        maxSlots: BigInt(Number(form.maxSlots)),
        filledSlots: BigInt(0),
        scheduledTime: BigInt(
          new Date(form.scheduledTime || Date.now()).getTime() * 1_000_000,
        ),
        status: Variant_upcoming_live_completed.upcoming,
        roomId: undefined,
        roomPassword: undefined,
      };
      await addMatch.mutateAsync(match);
      toast.success("Match added successfully!");
      setForm({
        title: "",
        category: Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale,
        mode: "",
        entryFee: "",
        prizePool: "",
        maxSlots: "",
        scheduledTime: "",
      });
    } catch {
      toast.error("Failed to add match");
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-background px-4 pt-8">
        <Skeleton className="h-8 w-40 bg-muted mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-16 bg-muted rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
        <AlertTriangle size={52} className="text-destructive/50 mb-4" />
        <h2 className="font-gaming text-2xl text-muted-foreground">
          Access Denied
        </h2>
        <p className="text-sm text-muted-foreground/60 mt-2">
          You don't have admin privileges
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-8 pb-4">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-primary" />
          <div className="h-1 w-8 bg-primary rounded-full" />
        </div>
        <h1 className="font-gaming text-3xl font-extrabold tracking-tight">
          ADMIN PANEL
        </h1>
      </header>

      <div className="px-4 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-xl p-4 space-y-4"
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
            ADD MATCH
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                TITLE *
              </Label>
              <Input
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
                placeholder="Match title"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                CATEGORY
              </Label>
              <Select
                value={form.category}
                onValueChange={(v) =>
                  setForm((p) => ({
                    ...p,
                    category:
                      v as Variant_BattleRoyale_other_ClashSquad_LoneWolf,
                  }))
                }
              >
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem
                    value={
                      Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale
                    }
                  >
                    Battle Royale
                  </SelectItem>
                  <SelectItem
                    value={
                      Variant_BattleRoyale_other_ClashSquad_LoneWolf.ClashSquad
                    }
                  >
                    Clash Squad
                  </SelectItem>
                  <SelectItem
                    value={
                      Variant_BattleRoyale_other_ClashSquad_LoneWolf.LoneWolf
                    }
                  >
                    Lone Wolf
                  </SelectItem>
                  <SelectItem
                    value={Variant_BattleRoyale_other_ClashSquad_LoneWolf.other}
                  >
                    Other
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                MODE *
              </Label>
              <Input
                value={form.mode}
                onChange={(e) =>
                  setForm((p) => ({ ...p, mode: e.target.value }))
                }
                placeholder="e.g. Solo/Duo"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                ENTRY FEE (৳)
              </Label>
              <Input
                type="number"
                value={form.entryFee}
                onChange={(e) =>
                  setForm((p) => ({ ...p, entryFee: e.target.value }))
                }
                placeholder="0"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                PRIZE POOL (৳)
              </Label>
              <Input
                type="number"
                value={form.prizePool}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prizePool: e.target.value }))
                }
                placeholder="0"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                MAX SLOTS
              </Label>
              <Input
                type="number"
                value={form.maxSlots}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxSlots: e.target.value }))
                }
                placeholder="50"
                className="bg-muted border-border"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                SCHEDULED TIME
              </Label>
              <Input
                type="datetime-local"
                value={form.scheduledTime}
                onChange={(e) =>
                  setForm((p) => ({ ...p, scheduledTime: e.target.value }))
                }
                className="bg-muted border-border"
              />
            </div>
          </div>
          <Button
            data-ocid="admin.add_match_button"
            onClick={handleAddMatch}
            disabled={addMatch.isPending}
            className="w-full bg-primary text-primary-foreground font-gaming tracking-widest glow-orange hover:bg-primary/90"
          >
            {addMatch.isPending ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : (
              <Plus size={16} className="mr-2" />
            )}
            ADD MATCH
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
            PENDING PAYMENTS
          </h2>
          {pendingTx.length === 0 ? (
            <div className="py-6 text-center">
              <CheckCircle
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No pending payments
              </p>
            </div>
          ) : (
            pendingTx.map((tx, i) => (
              <div
                key={tx.id.toString()}
                className="flex items-center justify-between gap-3 py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="font-mono text-sm">৳{Number(tx.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.description}
                  </p>
                </div>
                <Button
                  data-ocid={`admin.approve_payment_button.${i + 1}`}
                  size="sm"
                  onClick={async () => {
                    try {
                      await approvePayment.mutateAsync(tx.id);
                      toast.success("Payment approved!");
                    } catch {
                      toast.error("Failed to approve payment");
                    }
                  }}
                  disabled={approvePayment.isPending}
                  className="bg-green-600 hover:bg-green-500 text-white font-gaming text-xs"
                >
                  APPROVE
                </Button>
              </div>
            ))
          )}
        </motion.div>
      </div>
    </div>
  );
}
