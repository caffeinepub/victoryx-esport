import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Edit2,
  Loader2,
  Plus,
  Shield,
  Swords,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_upcoming_live_completed } from "../backend.d";
import {
  type TournamentMatch,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  useAddMatch,
  useAllMatches,
  useApprovePayment,
  useIsAdmin,
  useTransactionHistory,
  useUpdateMatch,
} from "../hooks/useQueries";

function toDatetimeLocal(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const STATUS_LABELS: Record<Variant_upcoming_live_completed, string> = {
  [Variant_upcoming_live_completed.upcoming]: "UPCOMING",
  [Variant_upcoming_live_completed.live]: "LIVE",
  [Variant_upcoming_live_completed.completed]: "COMPLETED",
};

const STATUS_COLORS: Record<Variant_upcoming_live_completed, string> = {
  [Variant_upcoming_live_completed.upcoming]:
    "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  [Variant_upcoming_live_completed.live]:
    "bg-green-500/20 text-green-400 border border-green-500/30",
  [Variant_upcoming_live_completed.completed]:
    "bg-muted text-muted-foreground border border-border",
};

interface EditForm {
  title: string;
  category: Variant_BattleRoyale_other_ClashSquad_LoneWolf;
  mode: string;
  entryFee: string;
  prizePool: string;
  maxSlots: string;
  scheduledTime: string;
  status: Variant_upcoming_live_completed;
  roomId: string;
  roomPassword: string;
}

export default function AdminPage() {
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const addMatch = useAddMatch();
  const updateMatch = useUpdateMatch();
  const approvePayment = useApprovePayment();
  const { data: transactions } = useTransactionHistory();
  const { data: allMatches } = useAllMatches();

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

  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(
    null,
  );
  const [editForm, setEditForm] = useState<EditForm | null>(null);

  const openEdit = (match: TournamentMatch) => {
    setEditingMatch(match);
    setEditForm({
      title: match.title,
      category: match.category,
      mode: match.mode,
      entryFee: Number(match.entryFee).toString(),
      prizePool: Number(match.prizePool).toString(),
      maxSlots: Number(match.maxSlots).toString(),
      scheduledTime: toDatetimeLocal(match.scheduledTime),
      status: match.status,
      roomId: match.roomId || "",
      roomPassword: match.roomPassword || "",
    });
  };

  const closeEdit = () => {
    setEditingMatch(null);
    setEditForm(null);
  };

  const handleSaveEdit = async () => {
    if (!editingMatch || !editForm) return;
    try {
      const updated: TournamentMatch = {
        ...editingMatch,
        title: editForm.title,
        category: editForm.category,
        mode: editForm.mode,
        entryFee: BigInt(Number(editForm.entryFee)),
        prizePool: BigInt(Number(editForm.prizePool) || 0),
        maxSlots: BigInt(Number(editForm.maxSlots)),
        scheduledTime: BigInt(
          new Date(editForm.scheduledTime || Date.now()).getTime() * 1_000_000,
        ),
        status: editForm.status,
        roomId: editForm.roomId || undefined,
        roomPassword: editForm.roomPassword || undefined,
      };
      await updateMatch.mutateAsync(updated);
      toast.success("Match updated successfully!");
      closeEdit();
    } catch {
      toast.error("Failed to update match");
    }
  };

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
    <div className="min-h-screen bg-background pb-24">
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
        {/* ADD MATCH */}
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

        {/* PENDING PAYMENTS */}
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

        {/* MATCH LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
            MATCH LIST
          </h2>
          {!allMatches || allMatches.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="admin.match.empty_state"
            >
              <Swords
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">No matches yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allMatches.map((match, i) => (
                <div
                  key={match.id.toString()}
                  data-ocid={`admin.match.item.${i + 1}`}
                  className="flex items-center justify-between gap-3 py-3 px-3 rounded-lg bg-muted/40 border border-border/40"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-gaming text-sm truncate">
                      {match.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-[10px] font-gaming px-2 py-0.5 rounded-full ${STATUS_COLORS[match.status]}`}
                      >
                        {STATUS_LABELS[match.status]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {match.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        ৳{Number(match.entryFee)}
                      </span>
                    </div>
                  </div>
                  <Button
                    data-ocid={`admin.match.edit_button.${i + 1}`}
                    size="sm"
                    variant="outline"
                    onClick={() => openEdit(match)}
                    className="border-primary/50 text-primary hover:bg-primary/10 font-gaming text-xs shrink-0"
                  >
                    <Edit2 size={12} className="mr-1" />
                    EDIT
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* EDIT MODAL */}
      <Dialog
        open={!!editingMatch}
        onOpenChange={(open) => !open && closeEdit()}
      >
        <DialogContent
          data-ocid="admin.match.dialog"
          className="bg-background border-border max-w-md max-h-[90vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-gaming tracking-widest text-primary">
              EDIT MATCH
            </DialogTitle>
          </DialogHeader>
          {editForm && (
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  TITLE
                </Label>
                <Input
                  data-ocid="admin.match.input"
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, title: e.target.value } : p,
                    )
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  CATEGORY
                </Label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) =>
                    setEditForm((p) =>
                      p
                        ? {
                            ...p,
                            category:
                              v as Variant_BattleRoyale_other_ClashSquad_LoneWolf,
                          }
                        : p,
                    )
                  }
                >
                  <SelectTrigger
                    data-ocid="admin.match.select"
                    className="bg-muted border-border"
                  >
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
                      value={
                        Variant_BattleRoyale_other_ClashSquad_LoneWolf.other
                      }
                    >
                      Other
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  STATUS
                </Label>
                <Select
                  value={editForm.status}
                  onValueChange={(v) =>
                    setEditForm((p) =>
                      p
                        ? { ...p, status: v as Variant_upcoming_live_completed }
                        : p,
                    )
                  }
                >
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem
                      value={Variant_upcoming_live_completed.upcoming}
                    >
                      Upcoming
                    </SelectItem>
                    <SelectItem value={Variant_upcoming_live_completed.live}>
                      Live
                    </SelectItem>
                    <SelectItem
                      value={Variant_upcoming_live_completed.completed}
                    >
                      Completed
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  MODE
                </Label>
                <Input
                  value={editForm.mode}
                  onChange={(e) =>
                    setEditForm((p) => (p ? { ...p, mode: e.target.value } : p))
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  ENTRY FEE (৳)
                </Label>
                <Input
                  type="number"
                  value={editForm.entryFee}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, entryFee: e.target.value } : p,
                    )
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  PRIZE POOL (৳)
                </Label>
                <Input
                  type="number"
                  value={editForm.prizePool}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, prizePool: e.target.value } : p,
                    )
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  MAX SLOTS
                </Label>
                <Input
                  type="number"
                  value={editForm.maxSlots}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, maxSlots: e.target.value } : p,
                    )
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  SCHEDULED TIME
                </Label>
                <Input
                  type="datetime-local"
                  value={editForm.scheduledTime}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, scheduledTime: e.target.value } : p,
                    )
                  }
                  className="bg-muted border-border"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  ROOM ID (optional)
                </Label>
                <Input
                  value={editForm.roomId}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, roomId: e.target.value } : p,
                    )
                  }
                  placeholder="Room ID for players"
                  className="bg-muted border-border"
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  ROOM PASSWORD (optional)
                </Label>
                <Input
                  value={editForm.roomPassword}
                  onChange={(e) =>
                    setEditForm((p) =>
                      p ? { ...p, roomPassword: e.target.value } : p,
                    )
                  }
                  placeholder="Room password for players"
                  className="bg-muted border-border"
                />
              </div>
              <div className="col-span-2 flex gap-3 pt-2">
                <Button
                  data-ocid="admin.match.cancel_button"
                  variant="outline"
                  onClick={closeEdit}
                  className="flex-1 border-border font-gaming tracking-widest"
                >
                  CANCEL
                </Button>
                <Button
                  data-ocid="admin.match.save_button"
                  onClick={handleSaveEdit}
                  disabled={updateMatch.isPending}
                  className="flex-1 bg-primary text-primary-foreground font-gaming tracking-widest glow-orange hover:bg-primary/90"
                >
                  {updateMatch.isPending ? (
                    <Loader2 className="animate-spin mr-2" size={16} />
                  ) : null}
                  SAVE
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
