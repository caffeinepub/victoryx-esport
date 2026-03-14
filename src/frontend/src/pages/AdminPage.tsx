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
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertTriangle,
  ArrowUpCircle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  Plus,
  Search,
  Shield,
  Swords,
  Trash2,
  Trophy,
  UserCog,
  Users,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { Variant_upcoming_live_completed } from "../backend.d";
import {
  type PaymentRequest,
  type TournamentMatch,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  Variant_pending_approved_rejected,
  type WithdrawRequest,
  useAddMatch,
  useAddWinningAmount,
  useAllMatches,
  useAllPendingPayments,
  useAllPendingWithdraws,
  useAllUsers,
  useApprovePayment,
  useApproveWithdraw,
  useDeleteMatch,
  useGetUserProfile,
  useIsAdmin,
  useRejectPayment,
  useRejectWithdraw,
  useUpdateMatch,
} from "../hooks/useQueries";
import { ADMIN_SESSION_KEY } from "./AdminLoginPage";
import {
  MODE_LABELS,
  STAFF_LIST_KEY,
  type StaffMember,
  type StaffMode,
} from "./StaffLoginPage";

function toDatetimeLocal(nanos: bigint): string {
  const ms = Number(nanos) / 1_000_000;
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getRejectedPaymentIds(): Set<string> {
  try {
    const stored = localStorage.getItem("vx_rejected_payments");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function loadSlots(matchId: bigint): Record<string, string> {
  try {
    const stored = localStorage.getItem(`vx_slots_${matchId.toString()}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

interface MatchResultPlayer {
  name: string;
  points: number;
  isWinner: boolean;
}

function loadMatchResults(matchId: bigint): MatchResultPlayer[] {
  try {
    const stored = localStorage.getItem(
      `vx_match_results_${matchId.toString()}`,
    );
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveMatchResults(matchId: bigint, players: MatchResultPlayer[]) {
  localStorage.setItem(
    `vx_match_results_${matchId.toString()}`,
    JSON.stringify(players),
  );
}

function getStaffList(): StaffMember[] {
  try {
    const stored = localStorage.getItem(STAFF_LIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveStaffList(list: StaffMember[]) {
  localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(list));
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

function SlotPanel({ match }: { match: TournamentMatch }) {
  const maxSlots = Number(match.maxSlots) || 50;
  const slots = loadSlots(match.id);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="overflow-hidden"
    >
      <div className="mt-2 pt-2 border-t border-border/40">
        <div className="flex items-center gap-1.5 mb-2">
          <Users size={12} className="text-primary" />
          <span className="text-[10px] font-gaming tracking-widest text-primary">
            REGISTERED SLOTS
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          {Array.from({ length: maxSlots }, (_, i) => i + 1).map((slotNum) => {
            const name = slots[slotNum.toString()];
            return (
              <div
                key={slotNum}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs ${
                  name
                    ? "bg-green-500/10 border border-green-500/20"
                    : "bg-muted/30 border border-border/20"
                }`}
              >
                <span className="text-[10px] text-muted-foreground font-mono w-7 shrink-0">
                  #{slotNum}
                </span>
                <span
                  className={`truncate ${
                    name
                      ? "text-green-400 font-medium"
                      : "text-muted-foreground/40"
                  }`}
                >
                  {name || "—"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminPage() {
  const localAdminAuth = localStorage.getItem(ADMIN_SESSION_KEY) === "true";
  const { data: isAdminFromBackend, isLoading: adminLoading } = useIsAdmin();
  const isAdmin = localAdminAuth || !!isAdminFromBackend;

  const addMatch = useAddMatch();
  const updateMatch = useUpdateMatch();
  const deleteMatch = useDeleteMatch();
  const approvePayment = useApprovePayment();
  const rejectPayment = useRejectPayment();
  const approveWithdraw = useApproveWithdraw();
  const rejectWithdraw = useRejectWithdraw();
  const addWinningAmount = useAddWinningAmount();
  const { data: pendingPayments, isLoading: paymentsLoading } =
    useAllPendingPayments();
  const { data: pendingWithdraws, isLoading: withdrawsLoading } =
    useAllPendingWithdraws();
  const { data: allUsers } = useAllUsers();
  const { data: allMatches } = useAllMatches();

  const rejectedIds = getRejectedPaymentIds();
  const pendingList = (pendingPayments || []).filter(
    (r: PaymentRequest) =>
      r.status === Variant_pending_approved_rejected.pending &&
      !rejectedIds.has(r.id.toString()),
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
  const [deletingMatchId, setDeletingMatchId] = useState<bigint | null>(null);
  const [processingPaymentId, setProcessingPaymentId] = useState<bigint | null>(
    null,
  );
  const [processingWithdrawId, setProcessingWithdrawId] = useState<
    bigint | null
  >(null);
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());

  const [matchSearch, setMatchSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUserPrincipal, setSelectedUserPrincipal] =
    useState<Principal | null>(null);

  // Staff state
  const [staffList, setStaffList] = useState<StaffMember[]>(getStaffList);
  const [staffForm, setStaffForm] = useState({
    name: "",
    username: "",
    password: "",
    mode: "all" as StaffMode,
  });

  // Winning amount state
  const [winningUserPrincipal, setWinningUserPrincipal] = useState("");
  const [winningAmount, setWinningAmount] = useState("");

  const [resultDialogMatch, setResultDialogMatch] =
    useState<TournamentMatch | null>(null);
  const [resultPlayers, setResultPlayers] = useState<MatchResultPlayer[]>([]);
  const [changingStatusId, setChangingStatusId] = useState<bigint | null>(null);

  const toggleSlots = (matchId: bigint) => {
    const key = matchId.toString();
    setExpandedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

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
      toast.success("Match updated!");
      closeEdit();
    } catch (err) {
      console.error("Update match error:", err);
      toast.error("Failed to update match. Please try again.");
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

  const handleStatusChange = async (
    match: TournamentMatch,
    newStatus: Variant_upcoming_live_completed,
  ) => {
    if (newStatus === Variant_upcoming_live_completed.completed) {
      const slots = loadSlots(match.id);
      const existingResults = loadMatchResults(match.id);
      const players: MatchResultPlayer[] = Object.values(slots)
        .filter(Boolean)
        .map((name) => {
          const existing = existingResults.find((p) => p.name === name);
          return {
            name: name as string,
            points: existing?.points || 0,
            isWinner: existing?.isWinner || false,
          };
        });
      setResultDialogMatch(match);
      setResultPlayers(
        players.length > 0
          ? players
          : [{ name: "", points: 0, isWinner: false }],
      );
      return;
    }
    setChangingStatusId(match.id);
    try {
      await updateMatch.mutateAsync({ ...match, status: newStatus });
      toast.success("Match status updated");
    } catch {
      toast.error("Failed to update match status");
    } finally {
      setChangingStatusId(null);
    }
  };

  const handleSaveResult = async () => {
    if (!resultDialogMatch) return;
    saveMatchResults(resultDialogMatch.id, resultPlayers);
    setChangingStatusId(resultDialogMatch.id);
    try {
      await updateMatch.mutateAsync({
        ...resultDialogMatch,
        status: Variant_upcoming_live_completed.completed,
      });
      toast.success("Match completed and results saved!");
      setResultDialogMatch(null);
    } catch {
      toast.error("Failed to update match status");
    } finally {
      setChangingStatusId(null);
    }
  };

  const handleDeleteMatch = async (matchId: bigint) => {
    if (deletingMatchId !== null) return;
    setDeletingMatchId(matchId);
    try {
      await deleteMatch.mutateAsync(matchId);
      toast.success("Match deleted.");
    } catch {
      toast.error("Failed to delete match.");
    } finally {
      setDeletingMatchId(null);
    }
  };

  const handleApprove = async (req: PaymentRequest) => {
    if (processingPaymentId !== null) return;
    setProcessingPaymentId(req.id);
    try {
      await approvePayment.mutateAsync(req.id);
      toast.success("Payment approved!");
    } catch {
      toast.error("Failed to approve payment");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleReject = async (req: PaymentRequest) => {
    if (processingPaymentId !== null) return;
    setProcessingPaymentId(req.id);
    try {
      rejectPayment.mutate(req.id);
      toast.success("Payment rejected.");
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handleApproveWithdraw = async (req: WithdrawRequest) => {
    if (processingWithdrawId !== null) return;
    setProcessingWithdrawId(req.id);
    try {
      await approveWithdraw.mutateAsync(req.id);
      toast.success("Withdrawal approved!");
    } catch {
      toast.error("Failed to approve withdrawal");
    } finally {
      setProcessingWithdrawId(null);
    }
  };

  const handleRejectWithdraw = async (req: WithdrawRequest) => {
    if (processingWithdrawId !== null) return;
    setProcessingWithdrawId(req.id);
    try {
      rejectWithdraw.mutate(req.id);
      toast.success("Withdrawal rejected.");
    } finally {
      setProcessingWithdrawId(null);
    }
  };

  const handleAddWinning = async () => {
    if (!winningUserPrincipal) {
      toast.error("Please select a user");
      return;
    }
    const amt = Number(winningAmount);
    if (!winningAmount || Number.isNaN(amt) || amt <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      // Find principal from allUsers
      const user = (allUsers || []).find(
        (u) => u.principal.toString() === winningUserPrincipal,
      );
      if (!user) {
        toast.error("User not found");
        return;
      }
      await addWinningAmount.mutateAsync({
        userPrincipal: user.principal,
        amount: BigInt(Math.round(amt)),
      });
      toast.success(`₹${amt} winning amount added!`);
      setWinningUserPrincipal("");
      setWinningAmount("");
    } catch {
      toast.error("Failed to add winning amount");
    }
  };

  const handleCreateStaff = () => {
    if (!staffForm.name || !staffForm.username || !staffForm.password) {
      toast.error("Please fill all staff fields");
      return;
    }
    const existing = getStaffList();
    if (existing.find((s) => s.username === staffForm.username)) {
      toast.error("Username already exists");
      return;
    }
    const newStaff: StaffMember = {
      id: Date.now().toString(),
      name: staffForm.name,
      username: staffForm.username,
      password: staffForm.password,
      mode: staffForm.mode,
    };
    const updated = [...existing, newStaff];
    saveStaffList(updated);
    setStaffList(updated);
    setStaffForm({
      name: "",
      username: "",
      password: "",
      mode: "all" as StaffMode,
    });
    toast.success(`Staff "${newStaff.name}" created!`);
  };

  const handleDeleteStaff = (id: string) => {
    const updated = getStaffList().filter((s) => s.id !== id);
    saveStaffList(updated);
    setStaffList(updated);
    toast.success("Staff removed.");
  };

  if (!localAdminAuth && adminLoading) {
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
          You don&apos;t have admin privileges
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
                data-ocid="admin.match.input"
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
                ENTRY FEE (₹)
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
                PRIZE POOL (₹)
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
            data-ocid="admin.match.primary_button"
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
          {addMatch.isError && (
            <p
              data-ocid="admin.match.error_state"
              className="text-xs text-destructive text-center"
            >
              Failed to add match. Please try again.
            </p>
          )}
          {addMatch.isSuccess && (
            <p
              data-ocid="admin.match.success_state"
              className="text-xs text-green-400 text-center"
            >
              Match added successfully!
            </p>
          )}
        </motion.div>

        {/* STAFF MANAGEMENT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="gaming-card rounded-xl p-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <UserCog size={14} className="text-cyan-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              STAFF MANAGEMENT
            </h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                FULL NAME *
              </Label>
              <Input
                data-ocid="admin.staff.input"
                value={staffForm.name}
                onChange={(e) =>
                  setStaffForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Staff full name"
                className="bg-muted border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  USERNAME *
                </Label>
                <Input
                  data-ocid="admin.staff.input"
                  value={staffForm.username}
                  onChange={(e) =>
                    setStaffForm((p) => ({ ...p, username: e.target.value }))
                  }
                  placeholder="staff_user"
                  className="bg-muted border-border"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                  PASSWORD *
                </Label>
                <Input
                  data-ocid="admin.staff.input"
                  type="password"
                  value={staffForm.password}
                  onChange={(e) =>
                    setStaffForm((p) => ({ ...p, password: e.target.value }))
                  }
                  placeholder="••••••"
                  className="bg-muted border-border"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                ASSIGN MODE *
              </Label>
              <select
                data-ocid="admin.staff.select"
                value={staffForm.mode}
                onChange={(e) =>
                  setStaffForm((p) => ({
                    ...p,
                    mode: e.target.value as StaffMode,
                  }))
                }
                className="w-full h-9 rounded-md border border-border bg-muted px-3 text-sm font-gaming tracking-wide text-foreground focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              >
                {(Object.entries(MODE_LABELS) as [StaffMode, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label.toUpperCase()}
                    </option>
                  ),
                )}
              </select>
            </div>
            <Button
              data-ocid="admin.staff.primary_button"
              onClick={handleCreateStaff}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-gaming tracking-widest"
            >
              <Plus size={14} className="mr-2" />
              CREATE STAFF
            </Button>
          </div>

          {staffList.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <p className="text-[10px] font-gaming tracking-widest text-muted-foreground/60">
                EXISTING STAFF ({staffList.length})
              </p>
              {staffList.map((staff, i) => (
                <div
                  key={staff.id}
                  data-ocid={`admin.staff.item.${i + 1}`}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-cyan-500/10"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-gaming text-sm text-cyan-300">
                      {staff.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-mono">
                      @{staff.username}
                    </p>
                    <p className="text-[10px] text-cyan-400/60 font-gaming">
                      {MODE_LABELS[staff.mode || "all"].toUpperCase()}
                    </p>
                  </div>
                  <Button
                    data-ocid={`admin.staff.delete_button.${i + 1}`}
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteStaff(staff.id)}
                    className="border-red-500/40 text-red-400 hover:bg-red-500/10 px-2 shrink-0"
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {staffList.length === 0 && (
            <div
              className="py-4 text-center"
              data-ocid="admin.staff.empty_state"
            >
              <UserCog
                size={28}
                className="text-muted-foreground/20 mx-auto mb-1"
              />
              <p className="text-xs text-muted-foreground/50">
                No staff members yet
              </p>
              <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                Staff can login at /vx-staff, /vx-staff-br, /vx-staff-cs,
                /vx-staff-lw, /vx-staff-ot
              </p>
            </div>
          )}
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
          {paymentsLoading ? (
            <div
              data-ocid="admin.payment.loading_state"
              className="py-4 space-y-2"
            >
              <Skeleton className="h-10 bg-muted rounded-lg" />
              <Skeleton className="h-10 bg-muted rounded-lg" />
            </div>
          ) : pendingList.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="admin.payment.empty_state"
            >
              <CheckCircle
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No pending payments
              </p>
            </div>
          ) : (
            pendingList.map((req: PaymentRequest, i: number) => (
              <div
                key={req.id.toString()}
                data-ocid={`admin.payment.item.${i + 1}`}
                className="flex items-center justify-between gap-2 py-2 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold">
                    ₹{Number(req.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {req.user.toString().slice(0, 16)}...
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    data-ocid={`admin.payment.confirm_button.${i + 1}`}
                    size="sm"
                    onClick={() => handleApprove(req)}
                    disabled={processingPaymentId !== null}
                    className="bg-green-600 hover:bg-green-500 text-white font-gaming text-xs px-3"
                  >
                    {processingPaymentId === req.id &&
                    approvePayment.isPending ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <>
                        <CheckCircle size={12} className="mr-1" />
                        APPROVE
                      </>
                    )}
                  </Button>
                  <Button
                    data-ocid={`admin.payment.delete_button.${i + 1}`}
                    size="sm"
                    onClick={() => handleReject(req)}
                    disabled={processingPaymentId !== null}
                    className="bg-red-700 hover:bg-red-600 text-white font-gaming text-xs px-3"
                  >
                    <XCircle size={12} className="mr-1" />
                    REJECT
                  </Button>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* ADD WINNING AMOUNT */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="gaming-card rounded-xl p-4 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Trophy size={14} className="text-yellow-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              ADD WINNING AMOUNT
            </h2>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                SELECT PLAYER *
              </Label>
              <Select
                value={winningUserPrincipal}
                onValueChange={setWinningUserPrincipal}
              >
                <SelectTrigger
                  data-ocid="admin.winning.select"
                  className="bg-muted border-border"
                >
                  <SelectValue placeholder="Select player..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {!allUsers || allUsers.length === 0 ? (
                    <SelectItem value="__none__" disabled>
                      No users found
                    </SelectItem>
                  ) : (
                    allUsers.map((u) => (
                      <SelectItem
                        key={u.principal.toString()}
                        value={u.principal.toString()}
                      >
                        {u.username ||
                          `${u.principal.toString().slice(0, 12)}...`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                AMOUNT (₹) *
              </Label>
              <Input
                data-ocid="admin.winning.input"
                type="number"
                value={winningAmount}
                onChange={(e) => setWinningAmount(e.target.value)}
                placeholder="Enter winning amount"
                className="bg-muted border-border"
                min="1"
              />
            </div>
            <Button
              data-ocid="admin.winning.primary_button"
              onClick={handleAddWinning}
              disabled={addWinningAmount.isPending}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-black font-gaming tracking-widest"
            >
              {addWinningAmount.isPending ? (
                <Loader2 className="animate-spin mr-2" size={16} />
              ) : (
                <Trophy size={14} className="mr-2" />
              )}
              ADD WINNING
            </Button>
            {addWinningAmount.isSuccess && (
              <p
                data-ocid="admin.winning.success_state"
                className="text-xs text-green-400 text-center"
              >
                Winning amount added!
              </p>
            )}
            {addWinningAmount.isError && (
              <p
                data-ocid="admin.winning.error_state"
                className="text-xs text-destructive text-center"
              >
                Failed to add winning amount.
              </p>
            )}
          </div>
        </motion.div>

        {/* WITHDRAW REQUESTS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <ArrowUpCircle size={14} className="text-yellow-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              WITHDRAW REQUESTS
            </h2>
          </div>
          {withdrawsLoading ? (
            <div
              data-ocid="admin.withdraw.loading_state"
              className="py-4 space-y-2"
            >
              <Skeleton className="h-10 bg-muted rounded-lg" />
              <Skeleton className="h-10 bg-muted rounded-lg" />
            </div>
          ) : !pendingWithdraws || pendingWithdraws.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="admin.withdraw.empty_state"
            >
              <ArrowUpCircle
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No pending withdrawals
              </p>
            </div>
          ) : (
            pendingWithdraws.map((req: WithdrawRequest, i: number) => (
              <div
                key={req.id.toString()}
                data-ocid={`admin.withdraw.item.${i + 1}`}
                className="flex items-start justify-between gap-2 py-3 border-b border-border/50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm font-bold text-yellow-400">
                    ₹{Number(req.amount)}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {req.user.toString().slice(0, 16)}...
                  </p>
                  <p className="text-xs text-muted-foreground font-mono mt-0.5">
                    UPI: <span className="text-foreground">{req.upiId}</span>
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button
                    data-ocid={`admin.withdraw.confirm_button.${i + 1}`}
                    size="sm"
                    onClick={() => handleApproveWithdraw(req)}
                    disabled={processingWithdrawId !== null}
                    className="bg-green-600 hover:bg-green-500 text-white font-gaming text-xs px-3"
                  >
                    {processingWithdrawId === req.id &&
                    approveWithdraw.isPending ? (
                      <Loader2 className="animate-spin" size={12} />
                    ) : (
                      <>
                        <CheckCircle size={12} className="mr-1" />
                        APPROVE
                      </>
                    )}
                  </Button>
                  <Button
                    data-ocid={`admin.withdraw.delete_button.${i + 1}`}
                    size="sm"
                    onClick={() => handleRejectWithdraw(req)}
                    disabled={processingWithdrawId !== null}
                    className="bg-red-700 hover:bg-red-600 text-white font-gaming text-xs px-3"
                  >
                    <XCircle size={12} className="mr-1" />
                    REJECT
                  </Button>
                </div>
              </div>
            ))
          )}
        </motion.div>

        {/* MATCH LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
            MATCH LIST
          </h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="admin.match.search_input"
              placeholder="Search by match title..."
              value={matchSearch}
              onChange={(e) => setMatchSearch(e.target.value)}
              className="pl-8 bg-muted border-border text-sm font-gaming"
            />
          </div>
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
              {(matchSearch
                ? allMatches.filter((m) =>
                    m.title.toLowerCase().includes(matchSearch.toLowerCase()),
                  )
                : allMatches
              ).map((match, i) => {
                const isSlotOpen = expandedSlots.has(match.id.toString());
                return (
                  <div
                    key={match.id.toString()}
                    data-ocid={`admin.match.item.${i + 1}`}
                    className="py-3 px-3 rounded-lg bg-muted/40 border border-border/40"
                  >
                    <div className="flex items-center justify-between gap-2">
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
                            ₹{Number(match.entryFee)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          data-ocid={`admin.match.slots_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => toggleSlots(match.id)}
                          className="border-primary/30 text-primary hover:bg-primary/10 font-gaming text-xs px-2"
                        >
                          <Users size={11} className="mr-1" />
                          {isSlotOpen ? (
                            <ChevronUp size={11} />
                          ) : (
                            <ChevronDown size={11} />
                          )}
                        </Button>
                        {match.status ===
                          Variant_upcoming_live_completed.upcoming && (
                          <Button
                            data-ocid={`admin.match.golive_button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(
                                match,
                                Variant_upcoming_live_completed.live,
                              )
                            }
                            disabled={changingStatusId === match.id}
                            className="border-green-500/50 text-green-400 hover:bg-green-500/10 font-gaming text-[10px] px-2"
                          >
                            {changingStatusId === match.id ? (
                              <Loader2 className="animate-spin" size={10} />
                            ) : (
                              "GO LIVE"
                            )}
                          </Button>
                        )}
                        {match.status ===
                          Variant_upcoming_live_completed.live && (
                          <Button
                            data-ocid={`admin.match.endmatch_button.${i + 1}`}
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleStatusChange(
                                match,
                                Variant_upcoming_live_completed.completed,
                              )
                            }
                            disabled={changingStatusId === match.id}
                            className="border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/10 font-gaming text-[10px] px-2"
                          >
                            {changingStatusId === match.id ? (
                              <Loader2 className="animate-spin" size={10} />
                            ) : (
                              "END"
                            )}
                          </Button>
                        )}
                        <Button
                          data-ocid={`admin.match.edit_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(match)}
                          className="border-primary/50 text-primary hover:bg-primary/10 font-gaming text-xs px-2"
                        >
                          <Edit2 size={12} className="mr-1" />
                          EDIT
                        </Button>
                        <Button
                          data-ocid={`admin.match.delete_button.${i + 1}`}
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteMatch(match.id)}
                          disabled={deletingMatchId !== null}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10 font-gaming text-xs px-2"
                        >
                          {deletingMatchId === match.id ? (
                            <Loader2 className="animate-spin" size={12} />
                          ) : (
                            <Trash2 size={12} />
                          )}
                        </Button>
                      </div>
                    </div>
                    <AnimatePresence>
                      {isSlotOpen && <SlotPanel match={match} />}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* USER ACCOUNTS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground flex items-center gap-2">
            <Users size={16} className="text-primary" />
            USER ACCOUNTS
          </h2>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              data-ocid="admin.user.search_input"
              placeholder="Search by username, phone, or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-8 bg-muted border-border text-sm font-gaming"
            />
          </div>
          {!allUsers || allUsers.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="admin.user.empty_state"
            >
              <Users
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">No users yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(userSearch
                ? allUsers.filter(
                    (u: { principal: Principal; username: string }) =>
                      u.username
                        .toLowerCase()
                        .includes(userSearch.toLowerCase()),
                  )
                : allUsers
              ).map(
                (u: { principal: Principal; username: string }, i: number) => (
                  <button
                    key={u.principal.toString()}
                    type="button"
                    data-ocid={`admin.user.item.${i + 1}`}
                    className="w-full text-left py-2 px-3 rounded-lg bg-muted/40 border border-border/40 cursor-pointer hover:border-primary/40 transition-colors flex items-center justify-between"
                    onClick={() => setSelectedUserPrincipal(u.principal)}
                  >
                    <span className="font-gaming text-sm">{u.username}</span>
                    <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">
                      {u.principal.toString().slice(0, 12)}...
                    </span>
                  </button>
                ),
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* USER DETAIL DIALOG */}
      <UserDetailDialog
        principal={selectedUserPrincipal}
        open={!!selectedUserPrincipal}
        onClose={() => setSelectedUserPrincipal(null)}
      />

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
                  ENTRY FEE (₹)
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
                  PRIZE POOL (₹)
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

      {/* RESULT DIALOG */}
      <Dialog
        open={!!resultDialogMatch}
        onOpenChange={(open) => !open && setResultDialogMatch(null)}
      >
        <DialogContent
          data-ocid="admin.result.dialog"
          className="bg-background border-border max-w-md max-h-[80vh] overflow-y-auto"
        >
          <DialogHeader>
            <DialogTitle className="font-gaming text-primary">
              SET RESULTS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <p className="text-xs text-muted-foreground">
              Enter points and mark winner for each player
            </p>
            {resultPlayers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No registered players found
              </p>
            )}
            {resultPlayers.map((player, idx) => (
              <div
                key={`rp-${idx}-${player.name}`}
                data-ocid={`admin.result.player.item.${idx + 1}`}
                className="flex items-center gap-2 bg-muted/40 rounded-lg p-2"
              >
                <div className="flex-1">
                  {player.name ? (
                    <p className="font-gaming text-sm">{player.name}</p>
                  ) : (
                    <Input
                      placeholder="Player name"
                      value={player.name}
                      onChange={(e) => {
                        const updated = [...resultPlayers];
                        updated[idx] = {
                          ...updated[idx],
                          name: e.target.value,
                        };
                        setResultPlayers(updated);
                      }}
                      className="h-7 text-xs bg-muted border-border"
                    />
                  )}
                </div>
                <Input
                  type="number"
                  placeholder="Points"
                  value={player.points || ""}
                  onChange={(e) => {
                    const updated = [...resultPlayers];
                    updated[idx] = {
                      ...updated[idx],
                      points: Number(e.target.value),
                    };
                    setResultPlayers(updated);
                  }}
                  className="w-20 h-7 text-xs bg-muted border-border"
                />
                <button
                  type="button"
                  onClick={() => {
                    const updated = resultPlayers.map((p, i) => ({
                      ...p,
                      isWinner: i === idx,
                    }));
                    setResultPlayers(updated);
                  }}
                  className={`font-gaming text-[10px] px-2 py-1 rounded border transition-colors ${player.isWinner ? "border-yellow-400 text-yellow-400 bg-yellow-400/10" : "border-border text-muted-foreground hover:border-yellow-400/50"}`}
                >
                  {player.isWinner ? "★ WIN" : "WIN?"}
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setResultPlayers([
                  ...resultPlayers,
                  { name: "", points: 0, isWinner: false },
                ])
              }
              className="w-full border-dashed border-border text-muted-foreground font-gaming text-xs"
            >
              + Add Player
            </Button>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setResultDialogMatch(null)}
                className="flex-1 font-gaming text-xs border-border"
                data-ocid="admin.result.cancel_button"
              >
                CANCEL
              </Button>
              <Button
                onClick={handleSaveResult}
                disabled={changingStatusId !== null}
                className="flex-1 font-gaming text-xs bg-primary text-primary-foreground"
                data-ocid="admin.result.confirm_button"
              >
                {changingStatusId !== null ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  "SAVE & END MATCH"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function UserDetailDialog({
  principal,
  open,
  onClose,
}: {
  principal: Principal | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data: profile, isLoading } = useGetUserProfile(principal);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        data-ocid="admin.user.dialog"
        className="bg-background border-border max-w-md max-h-[90vh] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="font-gaming tracking-widest text-primary">
            USER DETAILS
          </DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div data-ocid="admin.user.loading_state" className="space-y-2 py-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : !profile ? (
          <p
            className="text-sm text-muted-foreground py-4"
            data-ocid="admin.user.error_state"
          >
            Profile not found.
          </p>
        ) : (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  USERNAME
                </p>
                <p className="text-sm font-gaming">{profile.username || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  GENDER
                </p>
                <p className="text-sm font-gaming">{profile.gender || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  FIRST NAME
                </p>
                <p className="text-sm">{profile.firstName || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  LAST NAME
                </p>
                <p className="text-sm">{profile.lastName || "—"}</p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                EMAIL
              </p>
              <p className="text-sm">{profile.email || "—"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                PHONE
              </p>
              <p className="text-sm">
                {profile.phoneNumbers && profile.phoneNumbers.length > 0
                  ? profile.phoneNumbers.join(", ")
                  : "—"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40">
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  WALLET BALANCE
                </p>
                <p className="text-sm font-gaming text-primary">
                  ₹{Number(profile.walletBalance)}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                  PRIZE BALANCE
                </p>
                <p className="text-sm font-gaming text-yellow-400">
                  ₹{Number(profile.winningBalance)}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-gaming tracking-wide text-muted-foreground">
                PRINCIPAL
              </p>
              <p className="text-[10px] font-mono text-muted-foreground break-all">
                {principal?.toString()}
              </p>
            </div>
          </div>
        )}
        <div className="flex justify-end mt-4">
          <Button
            data-ocid="admin.user.close_button"
            variant="outline"
            onClick={onClose}
            className="font-gaming tracking-widest border-border"
          >
            CLOSE
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
