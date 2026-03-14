import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Gender,
  type TournamentMatch,
  type UserProfile,
  Variant_BattleRoyale_other_ClashSquad_LoneWolf,
  type WalletTransaction,
} from "../backend.d";
import { useActor } from "./useActor";

export { Gender, Variant_BattleRoyale_other_ClashSquad_LoneWolf };
export type { UserProfile, TournamentMatch, WalletTransaction };

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

export function useAllMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<TournamentMatch[]>({
    queryKey: ["allMatches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllMatches();
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
      return actor.getMatchesByCategory(category);
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
    },
  });
}

export function useIsAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
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
      await actor.addMatch(match);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allMatches"] });
    },
  });
}

export function useUpdateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (match: TournamentMatch) => {
      if (!actor) throw new Error("No actor");
      await actor.addMatch(match);
    },
    onSuccess: () => {
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
      await actor.approvePaymentRequest(requestId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: ["walletBalance"] });
    },
  });
}
