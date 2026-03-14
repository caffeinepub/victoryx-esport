import Array "mo:core/Array";
import Int "mo:core/Int";
import Order "mo:core/Order";
import Time "mo:core/Time";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";




actor {
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Hardcoded admin token - works regardless of env variable
  let ADMIN_TOKEN : Text = "VictoryX@Admin2024";

  type Gender = {
    #male;
    #female;
    #other;
    #preferNotToSay;
  };

  type WalletTransaction = {
    id : Nat;
    amount : Int;
    transactionType : {
      #deposit;
      #withdraw;
      #entryFee;
      #winning;
    };
    timestamp : Time.Time;
    description : Text;
    status : {
      #pending;
      #completed;
    };
  };

  type TournamentMatch = {
    id : Nat;
    title : Text;
    category : {
      #BattleRoyale;
      #ClashSquad;
      #LoneWolf;
      #other;
    };
    mode : Text;
    entryFee : Int;
    prizePool : Int;
    maxSlots : Nat;
    filledSlots : Nat;
    scheduledTime : Time.Time;
    status : {
      #upcoming;
      #live;
      #completed;
    };
    roomId : ?Text;
    roomPassword : ?Text;
  };

  type PaymentRequest = {
    id : Nat;
    user : Principal;
    amount : Int;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    timestamp : Time.Time;
  };

  type WithdrawRequest = {
    id : Nat;
    user : Principal;
    amount : Int;
    upiId : Text;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    timestamp : Time.Time;
  };

  type UserProfile = {
    firstName : Text;
    lastName : Text;
    username : Text;
    email : Text;
    phoneNumbers : [Text];
    gender : Gender;
    languagePreference : Text;
    walletBalance : Int;
    winningBalance : Int;
    transactions : [WalletTransaction];
    registeredMatches : [Nat];
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let matches = Map.empty<Nat, TournamentMatch>();
  let paymentRequests = Map.empty<Nat, PaymentRequest>();
  let withdrawRequests = Map.empty<Nat, WithdrawRequest>();

  var nextMatchId = 1;
  var nextWithdrawRequestId = 1;
  var nextTransactionId = 1;
  var nextPaymentRequestId = 1;

  // Helper: check admin token
  func isValidAdminToken(token : Text) : Bool {
    token == ADMIN_TOKEN;
  };

  func isUserRegisteredForMatch(user : Principal, matchId : Nat) : Bool {
    switch (userProfiles.get(user)) {
      case (null) { false };
      case (?profile) {
        profile.registeredMatches.filter(func(id) { id == matchId }).size() > 0;
      };
    };
  };

  func sanitizeMatch(match : TournamentMatch, caller : Principal) : TournamentMatch {
    let isAdmin = AccessControl.isAdmin(accessControlState, caller);
    let isRegistered = isUserRegisteredForMatch(caller, match.id);
    if (isAdmin or isRegistered) {
      match;
    } else {
      {
        id = match.id;
        title = match.title;
        category = match.category;
        mode = match.mode;
        entryFee = match.entryFee;
        prizePool = match.prizePool;
        maxSlots = match.maxSlots;
        filledSlots = match.filledSlots;
        scheduledTime = match.scheduledTime;
        status = match.status;
        roomId = null;
        roomPassword = null;
      };
    };
  };

  // ===== UNIQUENESS CHECKS (public - needed during registration) =====
  public query func checkUsernameExists(username : Text) : async Bool {
    userProfiles.values().toArray().any(func(p) { p.username == username });
  };

  public query func checkPhoneExists(phone : Text) : async Bool {
    userProfiles.values().toArray().any(
      func(p) { p.phoneNumbers.any(func(n) { n == phone }) }
    );
  };

  public query func checkEmailExists(email : Text) : async Bool {
    userProfiles.values().toArray().any(func(p) { p.email == email });
  };

  // ===== USER FUNCTIONS =====
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    userProfiles.get(user);
  };

  public query ({ caller }) func getWalletBalance() : async Int {
    switch (userProfiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [WalletTransaction] {
    switch (userProfiles.get(caller)) {
      case (null) { [] };
      case (?profile) { profile.transactions };
    };
  };

  public shared ({ caller }) func requestPayment(amount : Int) : async () {
    let paymentRequest : PaymentRequest = {
      id = nextPaymentRequestId;
      user = caller;
      amount;
      status = #pending;
      timestamp = Time.now();
    };
    paymentRequests.add(nextPaymentRequestId, paymentRequest);
    nextPaymentRequestId += 1;
  };

  public shared ({ caller }) func registerForMatch(matchId : Nat) : async () {
    let matchEntry = matches.get(matchId);
    switch (matchEntry) {
      case (null) { Runtime.trap("Match not found") };
      case (?match) {
        if (match.filledSlots >= match.maxSlots) {
          Runtime.trap("Match is full");
        };

        let userProfile = switch (userProfiles.get(caller)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) { profile };
        };

        let totalBalance = userProfile.walletBalance + userProfile.winningBalance;
        if (totalBalance < match.entryFee) {
          Runtime.trap("Insufficient balance");
        };

        // Deduct from walletBalance first, then winningBalance for remainder
        let walletDeduction : Int = if (userProfile.walletBalance >= match.entryFee) {
          match.entryFee;
        } else {
          userProfile.walletBalance;
        };
        let winningDeduction : Int = match.entryFee - walletDeduction;

        let newTransaction : WalletTransaction = {
          id = nextTransactionId;
          amount = match.entryFee;
          transactionType = #entryFee;
          timestamp = Time.now();
          description = "Entry fee for match " # match.title;
          status = #completed;
        };

        let updatedProfile : UserProfile = {
          firstName = userProfile.firstName;
          lastName = userProfile.lastName;
          username = userProfile.username;
          email = userProfile.email;
          phoneNumbers = userProfile.phoneNumbers;
          gender = userProfile.gender;
          languagePreference = userProfile.languagePreference;
          walletBalance = userProfile.walletBalance - walletDeduction;
          winningBalance = userProfile.winningBalance - winningDeduction;
          transactions = userProfile.transactions.concat([newTransaction]);
          registeredMatches = userProfile.registeredMatches.concat([matchId]);
        };

        userProfiles.add(caller, updatedProfile);
        nextTransactionId += 1;

        let updatedMatch : TournamentMatch = {
          id = match.id;
          title = match.title;
          category = match.category;
          mode = match.mode;
          entryFee = match.entryFee;
          prizePool = match.prizePool;
          maxSlots = match.maxSlots;
          filledSlots = match.filledSlots + 1;
          scheduledTime = match.scheduledTime;
          status = match.status;
          roomId = match.roomId;
          roomPassword = match.roomPassword;
        };

        matches.add(matchId, updatedMatch);
      };
    };
  };

  public query ({ caller }) func getRegisteredMatches() : async [TournamentMatch] {
    let matchIds = switch (userProfiles.get(caller)) {
      case (null) { [] };
      case (?profile) { profile.registeredMatches };
    };
    matchIds.map(
      func(matchId) {
        switch (matches.get(matchId)) {
          case (null) { Runtime.trap("Match not found") };
          case (?match) { match };
        };
      }
    );
  };

  public query ({ caller }) func getAllMatches() : async [TournamentMatch] {
    matches.values().toArray().map(func(match) { sanitizeMatch(match, caller) });
  };

  public query ({ caller }) func getMatchesByCategory(category : { #BattleRoyale; #ClashSquad; #LoneWolf; #other }) : async [TournamentMatch] {
    matches.values().toArray().filter(
      func(match) { match.category == category }
    ).map(func(match) { sanitizeMatch(match, caller) });
  };

  // ICP Admin Functions
  public shared ({ caller }) func addMatch(newMatch : TournamentMatch) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can add matches");
    };
    let matchWithId : TournamentMatch = {
      id = nextMatchId;
      title = newMatch.title;
      category = newMatch.category;
      mode = newMatch.mode;
      entryFee = newMatch.entryFee;
      prizePool = newMatch.prizePool;
      maxSlots = newMatch.maxSlots;
      filledSlots = 0;
      scheduledTime = newMatch.scheduledTime;
      status = #upcoming;
      roomId = newMatch.roomId;
      roomPassword = newMatch.roomPassword;
    };
    matches.add(nextMatchId, matchWithId);
    nextMatchId += 1;
  };

  public shared ({ caller }) func approvePaymentRequest(requestId : Nat) : async () {
    if (not (AccessControl.isAdmin(accessControlState, caller))) {
      Runtime.trap("Unauthorized: Only admins can approve payment requests");
    };
    switch (paymentRequests.get(requestId)) {
      case (null) { Runtime.trap("Payment request not found") };
      case (?request) {
        paymentRequests.add(requestId, { id = request.id; user = request.user; amount = request.amount; status = #approved; timestamp = request.timestamp });
        switch (userProfiles.get(request.user)) {
          case (null) {};
          case (?profile) {
            let newTx : WalletTransaction = { id = nextTransactionId; amount = request.amount; transactionType = #deposit; timestamp = Time.now(); description = "Payment request approved"; status = #completed };
            userProfiles.add(request.user, { firstName = profile.firstName; lastName = profile.lastName; username = profile.username; email = profile.email; phoneNumbers = profile.phoneNumbers; gender = profile.gender; languagePreference = profile.languagePreference; walletBalance = profile.walletBalance + request.amount; winningBalance = profile.winningBalance; transactions = profile.transactions.concat([newTx]); registeredMatches = profile.registeredMatches });
            nextTransactionId += 1;
          };
        };
      };
    };
  };

  // ===== TOKEN-BASED ADMIN FUNCTIONS =====

  public shared func addMatchWithToken(adminToken : Text, newMatch : TournamentMatch) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    let matchWithId : TournamentMatch = {
      id = nextMatchId;
      title = newMatch.title;
      category = newMatch.category;
      mode = newMatch.mode;
      entryFee = newMatch.entryFee;
      prizePool = newMatch.prizePool;
      maxSlots = newMatch.maxSlots;
      filledSlots = 0;
      scheduledTime = newMatch.scheduledTime;
      status = #upcoming;
      roomId = newMatch.roomId;
      roomPassword = newMatch.roomPassword;
    };
    matches.add(nextMatchId, matchWithId);
    nextMatchId += 1;
  };

  public shared func updateMatchWithToken(adminToken : Text, updatedMatch : TournamentMatch) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    matches.add(updatedMatch.id, updatedMatch);
  };

  public shared func deleteMatchWithToken(adminToken : Text, matchId : Nat) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    ignore matches.remove(matchId);
  };

  public shared func approvePaymentWithToken(adminToken : Text, requestId : Nat) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    switch (paymentRequests.get(requestId)) {
      case (null) {};
      case (?request) {
        paymentRequests.add(requestId, { id = request.id; user = request.user; amount = request.amount; status = #approved; timestamp = request.timestamp });
        switch (userProfiles.get(request.user)) {
          case (null) {};
          case (?profile) {
            let newTx : WalletTransaction = { id = nextTransactionId; amount = request.amount; transactionType = #deposit; timestamp = Time.now(); description = "Payment request approved"; status = #completed };
            userProfiles.add(request.user, { firstName = profile.firstName; lastName = profile.lastName; username = profile.username; email = profile.email; phoneNumbers = profile.phoneNumbers; gender = profile.gender; languagePreference = profile.languagePreference; walletBalance = profile.walletBalance + request.amount; winningBalance = profile.winningBalance; transactions = profile.transactions.concat([newTx]); registeredMatches = profile.registeredMatches });
            nextTransactionId += 1;
          };
        };
      };
    };
  };

  public shared func rejectPaymentWithToken(adminToken : Text, requestId : Nat) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    switch (paymentRequests.get(requestId)) {
      case (null) {};
      case (?request) {
        paymentRequests.add(requestId, { id = request.id; user = request.user; amount = request.amount; status = #rejected; timestamp = request.timestamp });
      };
    };
  };

  public query func getAllPendingPaymentsWithToken(adminToken : Text) : async [PaymentRequest] {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    paymentRequests.values().toArray().filter(func(req) { req.status == #pending });
  };

  // ========== WINNINGS & WITHDRAWALS ==========
  public shared ({ caller }) func requestWithdraw(amount : Int, upiId : Text) : async () {
    let userProfile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
    if (amount < 50) { Runtime.trap("Minimum withdraw amount is 50") };
    if (userProfile.winningBalance < amount) { Runtime.trap("Insufficient balance") };
    withdrawRequests.add(nextWithdrawRequestId, { id = nextWithdrawRequestId; user = caller; amount; upiId; status = #pending; timestamp = Time.now() });
    nextWithdrawRequestId += 1;
  };

  public shared func addWinningAmountWithToken(adminToken : Text, user : Principal, amount : Int) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    let userProfile = switch (userProfiles.get(user)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) { profile };
    };
    let winTx : WalletTransaction = { id = nextTransactionId; amount; transactionType = #winning; timestamp = Time.now(); description = "Winning amount added"; status = #completed };
    userProfiles.add(user, { firstName = userProfile.firstName; lastName = userProfile.lastName; username = userProfile.username; email = userProfile.email; phoneNumbers = userProfile.phoneNumbers; gender = userProfile.gender; languagePreference = userProfile.languagePreference; walletBalance = userProfile.walletBalance; winningBalance = userProfile.winningBalance + amount; transactions = userProfile.transactions.concat([winTx]); registeredMatches = userProfile.registeredMatches });
    nextTransactionId += 1;
  };

  public shared func approveWithdrawWithToken(adminToken : Text, requestId : Nat) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    let req = switch (withdrawRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdraw request not found") };
      case (?r) { r };
    };
    if (req.status != #pending) { Runtime.trap("Request already processed") };
    let profile = switch (userProfiles.get(req.user)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };
    if (profile.winningBalance < req.amount) { Runtime.trap("Insufficient winning balance") };
    withdrawRequests.add(requestId, { id = req.id; user = req.user; amount = req.amount; upiId = req.upiId; status = #approved; timestamp = req.timestamp });
    let newTx : WalletTransaction = { id = nextTransactionId; amount = req.amount; transactionType = #withdraw; timestamp = Time.now(); description = "Withdraw approved"; status = #completed };
    userProfiles.add(req.user, { firstName = profile.firstName; lastName = profile.lastName; username = profile.username; email = profile.email; phoneNumbers = profile.phoneNumbers; gender = profile.gender; languagePreference = profile.languagePreference; walletBalance = profile.walletBalance; winningBalance = profile.winningBalance - req.amount; transactions = profile.transactions.concat([newTx]); registeredMatches = profile.registeredMatches });
    nextTransactionId += 1;
  };

  public shared func rejectWithdrawWithToken(adminToken : Text, requestId : Nat) : async () {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    let req = switch (withdrawRequests.get(requestId)) {
      case (null) { Runtime.trap("Withdraw request not found") };
      case (?r) { r };
    };
    if (req.status != #pending) { Runtime.trap("Request already processed") };
    withdrawRequests.add(requestId, { id = req.id; user = req.user; amount = req.amount; upiId = req.upiId; status = #rejected; timestamp = req.timestamp });
  };

  public query func getAllPendingWithdrawsWithToken(adminToken : Text) : async [WithdrawRequest] {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    withdrawRequests.values().toArray().filter(func(req) { req.status == #pending });
  };

  public query func getAllUsersWithToken(adminToken : Text) : async [{ principal : Principal; username : Text }] {
    if (not isValidAdminToken(adminToken)) { Runtime.trap("Unauthorized: Invalid admin token") };
    userProfiles.toArray().map(func((principal, profile)) { { principal; username = profile.username } });
  };
};
