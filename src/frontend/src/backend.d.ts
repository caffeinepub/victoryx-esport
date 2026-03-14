import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface TournamentMatch {
    id: bigint;
    status: Variant_upcoming_live_completed;
    title: string;
    maxSlots: bigint;
    scheduledTime: Time;
    mode: string;
    roomPassword?: string;
    category: Variant_BattleRoyale_other_ClashSquad_LoneWolf;
    entryFee: bigint;
    roomId?: string;
    filledSlots: bigint;
    prizePool: bigint;
}
export interface WalletTransaction {
    id: bigint;
    status: Variant_pending_completed;
    transactionType: Variant_withdraw_deposit_entryFee_winning;
    description: string;
    timestamp: Time;
    amount: bigint;
}
export interface PaymentRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    user: Principal;
    timestamp: Time;
    amount: bigint;
}
export interface WithdrawRequest {
    id: bigint;
    status: Variant_pending_approved_rejected;
    user: Principal;
    timestamp: Time;
    upiId: string;
    amount: bigint;
}
export interface UserProfile {
    languagePreference: string;
    username: string;
    phoneNumbers: Array<string>;
    winningBalance: bigint;
    registeredMatches: Array<bigint>;
    email: string;
    gender: Gender;
    transactions: Array<WalletTransaction>;
    lastName: string;
    walletBalance: bigint;
    firstName: string;
}
export enum Gender {
    other = "other",
    female = "female",
    male = "male",
    preferNotToSay = "preferNotToSay"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_BattleRoyale_other_ClashSquad_LoneWolf {
    BattleRoyale = "BattleRoyale",
    other = "other",
    ClashSquad = "ClashSquad",
    LoneWolf = "LoneWolf"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum Variant_pending_completed {
    pending = "pending",
    completed = "completed"
}
export enum Variant_upcoming_live_completed {
    upcoming = "upcoming",
    live = "live",
    completed = "completed"
}
export enum Variant_withdraw_deposit_entryFee_winning {
    withdraw = "withdraw",
    deposit = "deposit",
    entryFee = "entryFee",
    winning = "winning"
}
export interface backendInterface {
    addMatch(newMatch: TournamentMatch): Promise<void>;
    addMatchWithToken(adminToken: string, newMatch: TournamentMatch): Promise<void>;
    addWinningAmountWithToken(adminToken: string, user: Principal, amount: bigint): Promise<void>;
    approvePaymentRequest(requestId: bigint): Promise<void>;
    approvePaymentWithToken(adminToken: string, requestId: bigint): Promise<void>;
    approveWithdrawWithToken(adminToken: string, requestId: bigint): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    checkEmailExists(email: string): Promise<boolean>;
    checkPhoneExists(phone: string): Promise<boolean>;
    checkUsernameExists(username: string): Promise<boolean>;
    deleteMatchWithToken(adminToken: string, matchId: bigint): Promise<void>;
    getAllMatches(): Promise<Array<TournamentMatch>>;
    getAllPendingPaymentsWithToken(adminToken: string): Promise<Array<PaymentRequest>>;
    getAllPendingWithdrawsWithToken(adminToken: string): Promise<Array<WithdrawRequest>>;
    getAllUsersWithToken(adminToken: string): Promise<Array<{
        principal: Principal;
        username: string;
    }>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getMatchesByCategory(category: Variant_BattleRoyale_other_ClashSquad_LoneWolf): Promise<Array<TournamentMatch>>;
    getRegisteredMatches(): Promise<Array<TournamentMatch>>;
    getTransactionHistory(): Promise<Array<WalletTransaction>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletBalance(): Promise<bigint>;
    isCallerAdmin(): Promise<boolean>;
    registerForMatch(matchId: bigint): Promise<void>;
    rejectPaymentWithToken(adminToken: string, requestId: bigint): Promise<void>;
    rejectWithdrawWithToken(adminToken: string, requestId: bigint): Promise<void>;
    requestPayment(amount: bigint): Promise<void>;
    requestWithdraw(amount: bigint, upiId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateMatchWithToken(adminToken: string, updatedMatch: TournamentMatch): Promise<void>;
}
