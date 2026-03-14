import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  Edit2,
  Loader2,
  LogOut,
  Swords,
  UserCog,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  Variant_upcoming_live_completed,
} from "../backend.d";
import {
  type TournamentMatch,
  useAllMatches,
  useUpdateMatch,
} from "../hooks/useQueries";
import {
  MODE_LABELS,
  STAFF_SESSION_KEY,
  type StaffMode,
} from "./StaffLoginPage";

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

const CATEGORY_MODE_MAP: Record<
  StaffMode,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf | null
> = {
  all: null,
  BattleRoyale: Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale,
  ClashSquad: Variant_BattleRoyale_other_ClashSquad_LoneWolf.ClashSquad,
  LoneWolf: Variant_BattleRoyale_other_ClashSquad_LoneWolf.LoneWolf,
  other: Variant_BattleRoyale_other_ClashSquad_LoneWolf.other,
};

function loadSlots(matchId: bigint): Record<string, string> {
  try {
    const stored = localStorage.getItem(`vx_slots_${matchId.toString()}`);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
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
          <Users size={12} className="text-cyan-400" />
          <span className="text-[10px] font-gaming tracking-widest text-cyan-400">
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
                  {name || "\u2014"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

export default function StaffPage() {
  const navigate = useNavigate();
  const [staffName, setStaffName] = useState("");
  const [staffMode, setStaffMode] = useState<StaffMode>("all");
  const [editingMatch, setEditingMatch] = useState<TournamentMatch | null>(
    null,
  );
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [expandedSlots, setExpandedSlots] = useState<Set<string>>(new Set());
  const updateMatch = useUpdateMatch();
  const { data: allMatches } = useAllMatches();

  useEffect(() => {
    const session = localStorage.getItem(STAFF_SESSION_KEY);
    if (!session) {
      navigate({ to: "/vx-staff" });
      return;
    }
    try {
      const parsed = JSON.parse(session) as { name?: string; mode?: StaffMode };
      setStaffName(parsed.name || "Staff");
      setStaffMode(parsed.mode || "all");
    } catch {
      navigate({ to: "/vx-staff" });
    }
  }, [navigate]);

  // Filter matches by mode
  const filteredMatches = (allMatches || []).filter((match) => {
    const categoryFilter = CATEGORY_MODE_MAP[staffMode];
    if (categoryFilter === null) return true; // 'all' shows everything
    return match.category === categoryFilter;
  });

  const handleLogout = () => {
    localStorage.removeItem(STAFF_SESSION_KEY);
    navigate({ to: "/vx-staff" });
  };

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
    setRoomId(match.roomId || "");
    setRoomPassword(match.roomPassword || "");
  };

  const closeEdit = () => {
    setEditingMatch(null);
    setRoomId("");
    setRoomPassword("");
  };

  const handleSaveEdit = async () => {
    if (!editingMatch) return;
    try {
      const updated: TournamentMatch = {
        ...editingMatch,
        roomId: roomId || undefined,
        roomPassword: roomPassword || undefined,
      };
      await updateMatch.mutateAsync(updated);
      toast.success("Match updated!");
      closeEdit();
    } catch (err) {
      console.error("Update match error:", err);
      toast.error("Failed to update match.");
    }
  };

  const playersByMatch = filteredMatches.map((match) => {
    const slots = loadSlots(match.id);
    const players = Object.values(slots).filter(Boolean);
    return { match, players };
  });

  const modeLabel = MODE_LABELS[staffMode];

  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Header */}
      <header className="px-4 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UserCog size={20} className="text-cyan-400" />
              <div className="h-1 w-8 bg-cyan-500 rounded-full" />
            </div>
            <h1 className="font-gaming text-2xl font-extrabold tracking-tight">
              STAFF PANEL
            </h1>
            <p className="text-xs text-cyan-400 font-gaming tracking-widest mt-0.5">
              {staffName.toUpperCase()} &bull; {modeLabel.toUpperCase()}
            </p>
          </div>
          <Button
            data-ocid="staff.logout_button"
            size="sm"
            variant="outline"
            onClick={handleLogout}
            className="border-red-500/40 text-red-400 hover:bg-red-500/10 font-gaming text-xs"
          >
            <LogOut size={13} className="mr-1.5" />
            LOGOUT
          </Button>
        </div>
      </header>

      <div className="px-4 space-y-5">
        {/* MATCH LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Swords size={14} className="text-cyan-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              MATCH LIST {staffMode !== "all" && `— ${modeLabel.toUpperCase()}`}
            </h2>
          </div>
          {filteredMatches.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="staff.match.empty_state"
            >
              <Swords
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">No matches yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMatches.map((match, i) => (
                <div
                  key={match.id.toString()}
                  data-ocid={`staff.match.item.${i + 1}`}
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
                          {match.mode}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          ₹{Number(match.entryFee)}
                        </span>
                      </div>
                      {match.roomId && (
                        <p className="text-[10px] text-cyan-400/70 mt-1 font-mono">
                          Room: {match.roomId}
                        </p>
                      )}
                    </div>
                    <Button
                      data-ocid={`staff.match.edit_button.${i + 1}`}
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(match)}
                      className="border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/10 font-gaming text-xs px-2 shrink-0"
                    >
                      <Edit2 size={12} className="mr-1" />
                      EDIT
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* SLOT REGISTRATIONS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-cyan-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              SLOT REGISTRATIONS
            </h2>
          </div>
          {filteredMatches.length === 0 ? (
            <div
              className="py-6 text-center"
              data-ocid="staff.slots.empty_state"
            >
              <Users
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">No matches found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMatches.map((match, i) => {
                const isSlotOpen = expandedSlots.has(match.id.toString());
                return (
                  <div
                    key={match.id.toString()}
                    data-ocid={`staff.slots.item.${i + 1}`}
                    className="rounded-lg bg-muted/40 border border-border/40"
                  >
                    <button
                      data-ocid={`staff.slots.toggle.${i + 1}`}
                      type="button"
                      onClick={() => toggleSlots(match.id)}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-gaming text-sm">
                          {match.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {match.mode}
                        </span>
                      </div>
                      {isSlotOpen ? (
                        <ChevronUp
                          size={14}
                          className="text-cyan-400 shrink-0"
                        />
                      ) : (
                        <ChevronDown
                          size={14}
                          className="text-cyan-400 shrink-0"
                        />
                      )}
                    </button>
                    <AnimatePresence>
                      {isSlotOpen && (
                        <div className="px-3 pb-3">
                          <SlotPanel match={match} />
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* USER LIST */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gaming-card rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Users size={14} className="text-cyan-400" />
            <h2 className="font-gaming text-base tracking-widest text-muted-foreground">
              USER LIST
            </h2>
          </div>
          {playersByMatch.every((g) => g.players.length === 0) ? (
            <div
              className="py-6 text-center"
              data-ocid="staff.users.empty_state"
            >
              <Users
                size={32}
                className="text-muted-foreground/30 mx-auto mb-2"
              />
              <p className="text-sm text-muted-foreground">
                No registered players yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {playersByMatch
                .filter((g) => g.players.length > 0)
                .map((group, i) => (
                  <div
                    key={group.match.id.toString()}
                    data-ocid={`staff.users.item.${i + 1}`}
                  >
                    <p className="font-gaming text-xs tracking-widest text-cyan-400 mb-1.5">
                      {group.match.title.toUpperCase()}
                    </p>
                    <div className="space-y-1">
                      {group.players.map((name, j) => (
                        <div
                          key={`player-${j}-${name}`}
                          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/30"
                        >
                          <span className="text-[10px] text-muted-foreground w-5 shrink-0 font-mono">
                            {j + 1}.
                          </span>
                          <span className="text-sm text-foreground font-medium">
                            {name}
                          </span>
                        </div>
                      ))}
                    </div>
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
          data-ocid="staff.match.dialog"
          className="bg-background border-border max-w-sm"
        >
          <DialogHeader>
            <DialogTitle className="font-gaming tracking-widest text-cyan-400">
              EDIT MATCH
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                ROOM ID
              </Label>
              <Input
                data-ocid="staff.match.input"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="bg-muted border-cyan-500/30"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-gaming tracking-wide text-muted-foreground">
                ROOM PASSWORD
              </Label>
              <Input
                data-ocid="staff.match.input"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder="Enter Room Password"
                className="bg-muted border-cyan-500/30"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-ocid="staff.match.cancel_button"
                variant="outline"
                onClick={closeEdit}
                className="flex-1 border-border font-gaming tracking-widest"
              >
                CANCEL
              </Button>
              <Button
                data-ocid="staff.match.save_button"
                onClick={handleSaveEdit}
                disabled={updateMatch.isPending}
                className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-gaming tracking-widest"
              >
                {updateMatch.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : null}
                SAVE
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
