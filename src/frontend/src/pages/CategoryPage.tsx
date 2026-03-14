import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  Flame,
  SearchX,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import type { TournamentMatch } from "../backend.d";
import {
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  useMatchesByCategory,
  useRegisterForMatch,
  useUserProfile,
} from "../hooks/useQueries";

const CATEGORY_META: Record<
  string,
  {
    label: string;
    sublabel: string;
    icon: typeof Flame;
    iconColor: string;
    gradient: string;
  }
> = {
  BattleRoyale: {
    label: "BattleR",
    sublabel: "Battle Royale",
    icon: Flame,
    iconColor: "text-orange-400",
    gradient: "from-orange-900/20",
  },
  ClashSquad: {
    label: "Clash Sq",
    sublabel: "Clash Squad",
    icon: Swords,
    iconColor: "text-blue-400",
    gradient: "from-blue-900/20",
  },
  LoneWolf: {
    label: "Lone Wolf",
    sublabel: "Solo Mode",
    icon: Target,
    iconColor: "text-purple-400",
    gradient: "from-purple-900/20",
  },
  other: {
    label: "Others",
    sublabel: "Special Events",
    icon: Trophy,
    iconColor: "text-emerald-400",
    gradient: "from-emerald-900/20",
  },
};

function getSlotCount(match: TournamentMatch): number {
  const maxSlots = Number(match.maxSlots);
  if (maxSlots > 0) return maxSlots;
  const mode = (match.mode || "").toLowerCase();
  if (mode.includes("solo")) return 2;
  if (mode.includes("duo")) return 4;
  return 50;
}

function getSlotsKey(matchId: bigint): string {
  return `vx_slots_${matchId.toString()}`;
}

function loadSlots(matchId: bigint): Record<string, string> {
  try {
    const stored = localStorage.getItem(getSlotsKey(matchId));
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

function saveSlots(matchId: bigint, slots: Record<string, string>) {
  localStorage.setItem(getSlotsKey(matchId), JSON.stringify(slots));
}

function isAlreadyRegistered(matchId: bigint, playerName: string): boolean {
  const slots = loadSlots(matchId);
  return Object.values(slots).some(
    (name) => name.toLowerCase() === playerName.toLowerCase(),
  );
}

function getRegisteredNames(matchId: bigint): string[] {
  const slots = loadSlots(matchId);
  return Object.values(slots).filter((name) => name && name.trim() !== "");
}

interface SlotDialogProps {
  match: TournamentMatch;
  open: boolean;
  onClose: () => void;
  playerName: string;
}

function SlotDialog({ match, open, onClose, playerName }: SlotDialogProps) {
  const slotCount = getSlotCount(match);
  const [slots, setSlots] = useState<Record<string, string>>(() =>
    loadSlots(match.id),
  );
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [nameInput, setNameInput] = useState(playerName);
  const registerMutation = useRegisterForMatch();
  const qc = useQueryClient();

  const handleCheck = (slotNum: number, checked: boolean) => {
    if (checked) {
      setSelectedSlot(slotNum);
      setNameInput(playerName);
    } else {
      setSelectedSlot(null);
    }
  };

  const handleConfirm = async () => {
    if (!selectedSlot || !nameInput.trim()) return;
    const updatedSlots = {
      ...slots,
      [selectedSlot.toString()]: nameInput.trim(),
    };
    saveSlots(match.id, updatedSlots);
    setSlots(updatedSlots);
    setSelectedSlot(null);
    try {
      await registerMutation.mutateAsync(match.id);
    } catch {
      // ignore backend errors — slot is saved locally
    }
    // Refresh wallet balance after entry fee deduction
    qc.invalidateQueries({ queryKey: ["userProfile"] });
    qc.invalidateQueries({ queryKey: ["walletBalance"] });
    toast.success(`Slot ${selectedSlot} registered for ${nameInput.trim()}!`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        data-ocid="entry.dialog"
        className="bg-card border-border max-w-sm w-full"
      >
        <DialogHeader>
          <DialogTitle className="font-gaming text-primary">
            {match.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Select a slot and enter your name to register
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[60vh] pr-1 space-y-2 mt-2">
          {Array.from({ length: slotCount }, (_, i) => i + 1).map((slotNum) => {
            const key = slotNum.toString();
            const takenBy = slots[key];
            const isTaken = !!takenBy;
            const isSelected = selectedSlot === slotNum;
            const ocidIndex = slotNum;

            return (
              <div
                key={slotNum}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 border transition-colors ${
                  isTaken
                    ? "border-green-500/30 bg-green-500/5"
                    : isSelected
                      ? "border-primary/50 bg-primary/10"
                      : "border-border bg-background/40"
                }`}
              >
                <Checkbox
                  data-ocid={`entry.slot.checkbox.${ocidIndex}`}
                  checked={isTaken ? true : isSelected}
                  disabled={isTaken}
                  onCheckedChange={(checked) =>
                    handleCheck(slotNum, checked === true)
                  }
                  className={isTaken ? "opacity-50" : ""}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-mono text-muted-foreground">
                    Slot {slotNum}
                  </span>
                  {isTaken && (
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-green-400 font-medium truncate">
                        {takenBy}
                      </span>
                      <Badge className="text-[9px] px-1.5 py-0 bg-green-500/20 text-green-400 border-green-500/30">
                        Registered
                      </Badge>
                    </div>
                  )}
                  {isSelected && !isTaken && (
                    <div className="flex gap-2 mt-1.5 items-center">
                      <Input
                        data-ocid="entry.name_input"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                        className="h-7 text-xs bg-background border-border"
                      />
                      <Button
                        data-ocid="entry.confirm_button"
                        size="sm"
                        onClick={handleConfirm}
                        disabled={
                          !nameInput.trim() || registerMutation.isPending
                        }
                        className="h-7 px-3 text-xs bg-primary text-primary-foreground whitespace-nowrap"
                      >
                        <CheckCircle2 size={12} className="mr-1" />
                        Confirm
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CategoryPage() {
  const { category } = useParams({ strict: false }) as { category?: string };
  const navigate = useNavigate();
  const validCategory =
    category && CATEGORY_META[category]
      ? (category as Variant_BattleRoyale_other_ClashSquad_LoneWolf)
      : Variant_BattleRoyale_other_ClashSquad_LoneWolf.BattleRoyale;
  const { data: matches, isLoading } = useMatchesByCategory(validCategory);
  const meta =
    CATEGORY_META[category || "BattleRoyale"] || CATEGORY_META.BattleRoyale;
  const Icon = meta.icon;
  const { data: profile } = useUserProfile();

  const [entryMatchId, setEntryMatchId] = useState<bigint | null>(null);

  const playerName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim() ||
      profile.username ||
      ""
    : "";

  const entryMatch = matches?.find((m) => m.id === entryMatchId) ?? null;

  const totalBalance =
    Number(profile?.walletBalance ?? 0) + Number(profile?.winningBalance ?? 0);

  return (
    <div className="min-h-screen bg-background">
      <header
        className={`bg-gradient-to-b ${meta.gradient} to-transparent px-4 pt-6 pb-4`}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate({ to: "/tournaments" })}
          className="mb-3 -ml-2 text-muted-foreground"
        >
          <ArrowLeft size={18} className="mr-1" /> Back
        </Button>
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-xl bg-background/40 flex items-center justify-center ${meta.iconColor}`}
          >
            <Icon size={26} />
          </div>
          <div>
            <h1 className="font-gaming text-2xl font-extrabold">
              {meta.label}
            </h1>
            <p className="text-muted-foreground text-sm">{meta.sublabel}</p>
          </div>
        </div>
      </header>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((n) => (
              <Skeleton key={n} className="h-24 rounded-xl bg-muted" />
            ))}
          </div>
        ) : !matches || matches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="matches.empty_state"
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <SearchX size={56} className="text-muted-foreground/30 mb-4" />
            <h3 className="font-gaming text-xl text-muted-foreground">
              No Live Match Found
            </h3>
            <p className="text-sm text-muted-foreground/60 mt-2">
              Check back soon for upcoming tournaments
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {matches.map((match, i) => {
              const alreadyRegistered =
                playerName && isAlreadyRegistered(match.id, playerName);
              const registeredNames = getRegisteredNames(match.id);
              const entryFee = Number(match.entryFee);
              const hasEnoughBalance =
                entryFee === 0 || totalBalance >= entryFee;
              return (
                <motion.div
                  key={match.id.toString()}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="gaming-card rounded-xl p-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-gaming text-base font-bold">
                        {match.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {match.mode}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-gaming tracking-wide ${
                        match.status === "live"
                          ? "bg-green-500/20 text-green-400"
                          : match.status === "upcoming"
                            ? "bg-primary/20 text-primary"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {String(match.status).toUpperCase()}
                    </span>
                  </div>

                  {/* Stats row */}
                  <div className="flex gap-4 mt-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        ENTRY FEE
                      </p>
                      <p className="font-mono text-sm text-primary">
                        ₹{entryFee}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">
                        PRIZE POOL
                      </p>
                      <p className="font-mono text-sm text-chart-3">
                        ₹{Number(match.prizePool)}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground">SLOTS</p>
                      <p className="font-mono text-sm">
                        {Number(match.filledSlots)}/{Number(match.maxSlots)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-3 pt-3 border-t border-border/30">
                    <p className="text-[10px] font-gaming tracking-widest text-muted-foreground mb-1">
                      DESCRIPTION
                    </p>
                    <p className="text-xs text-muted-foreground/50">—</p>
                  </div>

                  {/* Join Members */}
                  <div
                    data-ocid={`match.members_section.${i + 1}`}
                    className="mt-3"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <Users size={11} className="text-primary" />
                      <p className="text-[10px] font-gaming tracking-widest text-primary">
                        JOIN MEMBERS
                      </p>
                    </div>
                    {registeredNames.length === 0 ? (
                      <p className="text-xs text-muted-foreground/50">
                        No members yet
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {registeredNames.map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary border border-primary/20"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Entry button */}
                  <div className="flex flex-col items-end gap-1 mt-3">
                    {alreadyRegistered ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs px-3 py-1">
                        <CheckCircle2 size={12} className="mr-1" />
                        Already Registered
                      </Badge>
                    ) : (
                      <>
                        {!hasEnoughBalance && (
                          <p className="text-[10px] text-red-400 font-medium">
                            Insufficient balance
                          </p>
                        )}
                        <Button
                          data-ocid={`match.entry_button.${i + 1}`}
                          size="sm"
                          onClick={() => setEntryMatchId(match.id)}
                          disabled={!hasEnoughBalance}
                          className="bg-primary text-primary-foreground font-gaming text-xs tracking-wider px-4 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {entryFee > 0 ? `ENTRY ₹${entryFee}` : "ENTRY FREE"}
                        </Button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {entryMatch && (
        <SlotDialog
          match={entryMatch}
          open={entryMatchId !== null}
          onClose={() => setEntryMatchId(null)}
          playerName={playerName}
        />
      )}
    </div>
  );
}

export { Label };
