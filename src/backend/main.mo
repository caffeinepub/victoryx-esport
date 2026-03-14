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

  type UserProfile = {
    firstName : Text;
    lastName : Text;
    username : Text;
    phoneNumbers : [Text];
    gender : Gender;
    languagePreference : Text;
    walletBalance : Int;
    transactions : [WalletTransaction];
    registeredMatches : [Nat];
  };

  module UserProfile {
    public func compareByLastName(profile1 : UserProfile, profile2 : UserProfile) : Order.Order {
      Text.compare(profile1.lastName, profile2.lastName);
    };
  };

  let userProfiles = Map.empty<Principal, UserProfile>();
  let matches = Map.empty<Nat, TournamentMatch>();
  let paymentRequests = Map.empty<Nat, PaymentRequest>();

  var nextMatchId = 1;
  var nextTransactionId = 1;
  var nextPaymentRequestId = 1;

  // Helper function to check if user is registered for a match
  func isUserRegisteredForMatch(user : Principal, matchId : Nat) : Bool {
    switch (userProfiles.get(user)) {
      case (null) { false };
      case (?profile) {
        profile.registeredMatches.filter(func(id) { id == matchId }).size() > 0;
      };
    };
  };

  // Helper function to sanitize match data for non-registered users
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

  // User Functions

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getWalletBalance() : async Int {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wallet balance");
    };
    switch (userProfiles.get(caller)) {
      case (null) { 0 };
      case (?profile) { profile.walletBalance };
    };
  };

  public query ({ caller }) func getTransactionHistory() : async [WalletTransaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transaction history");
    };
    switch (userProfiles.get(caller)) {
      case (null) { [] };
      case (?profile) { profile.transactions };
    };
  };

  public shared ({ caller }) func requestPayment(amount : Int) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request payments");
    };

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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register for matches");
    };

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

        if (userProfile.walletBalance < match.entryFee) {
          Runtime.trap("Insufficient balance");
        };

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
          phoneNumbers = userProfile.phoneNumbers;
          gender = userProfile.gender;
          languagePreference = userProfile.languagePreference;
          walletBalance = userProfile.walletBalance - match.entryFee;
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view registered matches");
    };

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

  // Admin Functions

  public shared ({ caller }) func addMatch(newMatch : TournamentMatch) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
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
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve payment requests");
    };

    switch (paymentRequests.get(requestId)) {
      case (null) { Runtime.trap("Payment request not found") };
      case (?request) {
        let updatedRequest : PaymentRequest = {
          id = request.id;
          user = request.user;
          amount = request.amount;
          status = #approved;
          timestamp = request.timestamp;
        };

        paymentRequests.add(requestId, updatedRequest);

        let userProfile = switch (userProfiles.get(request.user)) {
          case (null) { Runtime.trap("User profile not found") };
          case (?profile) { profile };
        };

        let newTransaction : WalletTransaction = {
          id = nextTransactionId;
          amount = request.amount;
          transactionType = #deposit;
          timestamp = Time.now();
          description = "Payment request approved";
          status = #completed;
        };

        let updatedProfile : UserProfile = {
          firstName = userProfile.firstName;
          lastName = userProfile.lastName;
          username = userProfile.username;
          phoneNumbers = userProfile.phoneNumbers;
          gender = userProfile.gender;
          languagePreference = userProfile.languagePreference;
          walletBalance = userProfile.walletBalance + request.amount;
          transactions = userProfile.transactions.concat([newTransaction]);
          registeredMatches = userProfile.registeredMatches;
        };

        userProfiles.add(request.user, updatedProfile);
        nextTransactionId += 1;
      };
    };
  };

  // Public Queries - sanitize sensitive data for non-registered users

  public query ({ caller }) func getAllMatches() : async [TournamentMatch] {
    matches.values().toArray().map(func(match) { sanitizeMatch(match, caller) });
  };

  public query ({ caller }) func getMatchesByCategory(category : { #BattleRoyale; #ClashSquad; #LoneWolf; #other }) : async [TournamentMatch] {
    matches.values().toArray().filter(
      func(match) {
        match.category == category;
      }
    ).map(func(match) { sanitizeMatch(match, caller) });
  };
};
