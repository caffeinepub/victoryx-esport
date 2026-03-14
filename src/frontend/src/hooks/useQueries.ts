import type { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gender,
  type PaymentRequest,
  type TournamentMatch,
  type UserProfile,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  Variant_pending_approved_rejected,
  type WalletTransaction,
  type WithdrawRequest,
} from "../backend.d";
import { ADMIN_SESSION_KEY, ADMIN_TOKEN } from "../pages/AdminLoginPage";
import { useActor } from "./useActor";

export {
  Gender,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  Variant_pending_approved_rejected,
};
export type {
  PaymentRequest,
  TournamentMatch,
  UserProfile,
  WalletTransaction,
  WithdrawRequest,
};

// ---- localStorage helpers ----
function getDeletedMatchIds(): Set<string> {
  try {
    const stored = localStorage.getItem("vx_deleted_matches");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function persistDeletedMatchId(matchId: bigint) {
  try {
    const stored = localStorage.getItem("vx_deleted_matches");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const idStr = matchId.toString();
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      localStorage.setItem("vx_deleted_matches", JSON.stringify(ids));
    }
  } catch {
    /* ignore */
  }
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

function persistRejectedPaymentId(requestId: bigint) {
  try {
    const stored = localStorage.getItem("vx_rejected_payments");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const idStr = requestId.toString();
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      localStorage.setItem("vx_rejected_payments", JSON.stringify(ids));
    }
  } catch {
    /* ignore */
  }
}

function getRejectedWithdrawIds(): Set<string> {
  try {
    const stored = localStorage.getItem("vx_rejected_withdraws");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

function persistRejectedWithdrawId(requestId: bigint) {
  try {
    const stored = localStorage.getItem("vx_rejected_withdraws");
    const ids: string[] = stored ? JSON.parse(stored) : [];
    const idStr = requestId.toString();
    if (!ids.includes(idStr)) {
      ids.push(idStr);
      localStorage.setItem("vx_rejected_withdraws", JSON.stringify(ids));
    }
  } catch {
    /* ignore */
  }
}
// ---- end helpers ----

export function useUserProfile() {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("No actor");
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["userProfile"] });
    },
  });
}

export function useWalletBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["walletBalance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getWalletBalance();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useWinningBalance() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["winningBalance"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      const profile = await actor.getCallerUserProfile();
      return profile ? profile.winningBalance : BigInt(0);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useTransactionHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<WalletTransaction[]>({
    queryKey: ["transactions"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTransactionHistory();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAllPendingPayments() {
  const { actor, isFetching } = useActor();
  return useQuery<PaymentRequest[]>({
    queryKey: ["allPendingPayments"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllPendingPaymentsWithToken(ADMIN_TOKEN);
      const rejected = getRejectedPaymentIds();
      return all.filter(
        (r) =>
          r.status === Variant_pending_approved_rejected.pending &&
          !rejected.has(r.id.toString()),
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

export function useAllPendingWithdraws() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawRequest[]>({
    queryKey: ["allPendingWithdraws"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllPendingWithdrawsWithToken(ADMIN_TOKEN);
      const rejected = getRejectedWithdrawIds();
      return all.filter(
        (r) =>
          r.status === Variant_pending_approved_rejected.pending &&
          !rejected.has(r.id.toString()),
      );
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10_000,
  });
}

type UserListItem = { principal: Principal; username: string };

export function useAllUsers() {
  const { actor, isFetching } = useActor();
  return useQuery<UserListItem[]>({
    queryKey: ["allUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsersWithToken(ADMIN_TOKEN);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRequestPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.requestPayment(amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useRequestWithdraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiId,
    }: { amount: bigint; upiId: string }) => {
      if (!actor) throw new Error("No actor");
      await actor.requestWithdraw(amount, upiId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["winningBalance"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useApproveWithdraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.approveWithdrawWithToken(ADMIN_TOKEN, requestId);
    },
    onMutate: async (requestId: bigint) => {
      await qc.cancelQueries({ queryKey: ["allPendingWithdraws"] });
      const previous = qc.getQueryData<WithdrawRequest[]>([
        "allPendingWithdraws",
      ]);
      qc.setQueryData<WithdrawRequest[]>(["allPendingWithdraws"], (old) =>
        (old || []).filter((r) => r.id !== requestId),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(["allPendingWithdraws"], context.previous);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPendingWithdraws"] });
    },
  });
}

export function useRejectWithdraw() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("No actor");
      persistRejectedWithdrawId(requestId);
      try {
        await actor.rejectWithdrawWithToken(ADMIN_TOKEN, requestId);
      } catch {
        // Keep it rejected locally even if backend fails
      }
    },
    onMutate: async (requestId: bigint) => {
      persistRejectedWithdrawId(requestId);
      await qc.cancelQueries({ queryKey: ["allPendingWithdraws"] });
      qc.setQueryData<WithdrawRequest[]>(["allPendingWithdraws"], (old) =>
        (old || []).filter((r) => r.id !== requestId),
      );
    },
    onError: () => {
      // Do NOT restore — item stays removed.
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["allPendingWithdraws"] });
    },
  });
}

export function useAddWinningAmount() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userPrincipal,
      amount,
    }: { userPrincipal: Principal; amount: bigint }) => {
      if (!actor) throw new Error("No actor");
      await actor.addWinningAmountWithToken(ADMIN_TOKEN, userPrincipal, amount);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allUsers"] });
    },
  });
}

export function useAllMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<TournamentMatch[]>({
    queryKey: ["allMatches"],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getAllMatches();
      const deleted = getDeletedMatchIds();
      return all.filter((m) => !deleted.has(m.id.toString()));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useMatchesByCategory(
  category: Variant_BattleRoyale_other_ClashSquad_LoneWolf,
) {
  const { actor, isFetching } = useActor();
  return useQuery<TournamentMatch[]>({
    queryKey: ["matchesByCategory", category],
    queryFn: async () => {
      if (!actor) return [];
      const all = await actor.getMatchesByCategory(category);
      const deleted = getDeletedMatchIds();
      return all.filter((m) => !deleted.has(m.id.toString()));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisteredMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<TournamentMatch[]>({
    queryKey: ["registeredMatches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRegisteredMatches();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRegisterForMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.registerForMatch(matchId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registeredMatches"] });
      qc.invalidateQueries({ queryKey: ["userProfile"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch {
        return false;
      }
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: TournamentMatch) => {
      if (!actor) throw new Error("No actor");
      await actor.addMatchWithToken(ADMIN_TOKEN, match);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMatches"] });
      qc.invalidateQueries({ queryKey: ["matchesByCategory"] });
    },
  });
}

export function useUpdateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: TournamentMatch) => {
      if (!actor) throw new Error("No actor");
      await actor.updateMatchWithToken(ADMIN_TOKEN, match);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMatches"] });
      qc.invalidateQueries({ queryKey: ["matchesByCategory"] });
    },
  });
}

export function useDeleteMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: bigint) => {
      if (!actor) throw new Error("No actor");
      persistDeletedMatchId(matchId);
      try {
        await actor.deleteMatchWithToken(ADMIN_TOKEN, matchId);
      } catch {
        // Even if backend fails, keep it deleted locally
      }
    },
    onMutate: async (matchId: bigint) => {
      persistDeletedMatchId(matchId);
      await qc.cancelQueries({ queryKey: ["allMatches"] });
      await qc.cancelQueries({ queryKey: ["matchesByCategory"] });
      const previous = qc.getQueryData<TournamentMatch[]>(["allMatches"]);
      qc.setQueryData<TournamentMatch[]>(["allMatches"], (old) =>
        (old || []).filter((m) => m.id !== matchId),
      );
      for (const cat of ["BattleRoyale", "ClashSquad", "LoneWolf", "other"]) {
        qc.setQueryData<TournamentMatch[]>(["matchesByCategory", cat], (old) =>
          (old || []).filter((m) => m.id !== matchId),
        );
      }
      return { previous };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["allMatches"] });
      qc.invalidateQueries({ queryKey: ["matchesByCategory"] });
    },
  });
}

export function useApprovePayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("No actor");
      await actor.approvePaymentWithToken(ADMIN_TOKEN, requestId);
    },
    onMutate: async (requestId: bigint) => {
      await qc.cancelQueries({ queryKey: ["allPendingPayments"] });
      const previous = qc.getQueryData<PaymentRequest[]>([
        "allPendingPayments",
      ]);
      qc.setQueryData<PaymentRequest[]>(["allPendingPayments"], (old) =>
        (old || []).filter((r) => r.id !== requestId),
      );
      return { previous };
    },
    onError: (_err, _id, context) => {
      if (context?.previous) {
        qc.setQueryData(["allPendingPayments"], context.previous);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allPendingPayments"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
}

export function useRejectPayment() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (requestId: bigint) => {
      if (!actor) throw new Error("No actor");
      persistRejectedPaymentId(requestId);
      try {
        await actor.rejectPaymentWithToken(ADMIN_TOKEN, requestId);
      } catch {
        // Keep it rejected locally even if backend fails
      }
    },
    onMutate: async (requestId: bigint) => {
      persistRejectedPaymentId(requestId);
      await qc.cancelQueries({ queryKey: ["allPendingPayments"] });
      const previous = qc.getQueryData<PaymentRequest[]>([
        "allPendingPayments",
      ]);
      qc.setQueryData<PaymentRequest[]>(["allPendingPayments"], (old) =>
        (old || []).filter((r) => r.id !== requestId),
      );
      return { previous };
    },
    onError: () => {
      // Do NOT restore — item stays removed.
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["allPendingPayments"] });
    },
  });
}

export function useCheckUsername() {
  const { actor } = useActor();
  return async (username: string): Promise<boolean> => {
    if (!actor) return false;
    return actor.checkUsernameExists(username);
  };
}

export function useCheckPhone() {
  const { actor } = useActor();
  return async (phone: string): Promise<boolean> => {
    if (!actor) return false;
    return actor.checkPhoneExists(phone);
  };
}

export function useCheckEmail() {
  const { actor } = useActor();
  return async (email: string): Promise<boolean> => {
    if (!actor) return false;
    return actor.checkEmailExists(email);
  };
}

// Unused but keep for ADMIN_SESSION_KEY usage reference
export { ADMIN_SESSION_KEY };

export function useGetUserProfile(principal: Principal | null) {
  const { actor, isFetching } = useActor();
  return useQuery<UserProfile | null>({
    queryKey: ["userProfileDetail", principal?.toString()],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getUserProfile(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}
