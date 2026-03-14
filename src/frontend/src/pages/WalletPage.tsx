import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  QrCode,
  Wallet,
} from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import {
  type WalletTransaction,
  useRequestPayment,
  useTransactionHistory,
  useWalletBalance,
} from "../hooks/useQueries";

function TxRow({ tx, index }: { tx: WalletTransaction; index: number }) {
  const isDeposit = tx.transactionType === "deposit";
  const isWithdraw = tx.transactionType === "withdraw";
  const date = new Date(Number(tx.timestamp) / 1_000_000);

  return (
    <motion.div
      data-ocid={`wallet.transaction.item.${index + 1}`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-3 py-3 border-b border-border/50 last:border-0"
    >
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isDeposit
            ? "bg-green-500/20"
            : isWithdraw
              ? "bg-red-500/20"
              : "bg-primary/20"
        }`}
      >
        {isDeposit ? (
          <ArrowDownCircle size={18} className="text-green-400" />
        ) : isWithdraw ? (
          <ArrowUpCircle size={18} className="text-red-400" />
        ) : (
          <Wallet size={18} className="text-primary" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {tx.description || tx.transactionType}
        </p>
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString()}
        </p>
      </div>
      <div className="text-right">
        <p
          className={`font-mono text-sm font-bold ${
            isDeposit
              ? "text-green-400"
              : isWithdraw
                ? "text-red-400"
                : "text-primary"
          }`}
        >
          {isDeposit ? "+" : "-"}৳{Number(tx.amount)}
        </p>
        <Badge
          variant="outline"
          className={`text-[10px] ${
            tx.status === "completed"
              ? "text-green-400 border-green-500/30"
              : "text-yellow-400 border-yellow-500/30"
          }`}
        >
          {tx.status === "completed" ? (
            <CheckCircle2 size={8} className="mr-1" />
          ) : (
            <Clock size={8} className="mr-1" />
          )}
          {tx.status}
        </Badge>
      </div>
    </motion.div>
  );
}

export default function WalletPage() {
  const { data: balance, isLoading: balLoading } = useWalletBalance();
  const { data: txHistory, isLoading: txLoading } = useTransactionHistory();
  const requestPayment = useRequestPayment();

  const [addMoneyOpen, setAddMoneyOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [showQR, setShowQR] = useState(false);

  const handleAddMoneyClick = () => {
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setShowQR(true);
  };

  const handlePaid = async () => {
    try {
      await requestPayment.mutateAsync(BigInt(Math.round(Number(amount))));
      toast.success("Payment submitted! Balance will update shortly.");
      setAddMoneyOpen(false);
      setAmount("");
      setShowQR(false);
    } catch {
      toast.error("Failed to submit payment request");
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      setShowQR(false);
      setAmount("");
    }
    setAddMoneyOpen(open);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-8 pb-4">
        <div className="h-1 w-12 bg-primary rounded-full mb-3" />
        <h1 className="font-gaming text-3xl font-extrabold tracking-tight">
          WALLET
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your funds</p>
      </header>

      <div className="px-4 space-y-5">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="wallet.balance_section"
          className="gaming-card rounded-2xl p-6 bg-gradient-to-br from-primary/20 to-accent/10 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <p className="text-muted-foreground text-sm font-gaming tracking-widest">
            BALANCE
          </p>
          {balLoading ? (
            <Skeleton className="h-12 w-40 mt-2 bg-muted" />
          ) : (
            <p className="font-mono text-5xl font-bold text-foreground mt-1">
              <span className="text-primary text-2xl align-top mt-2 inline-block">
                ৳
              </span>
              {Number(balance ?? 0).toLocaleString()}
            </p>
          )}
          <Button
            data-ocid="wallet.add_money_button"
            onClick={() => setAddMoneyOpen(true)}
            className="mt-4 bg-primary text-primary-foreground font-gaming tracking-widest glow-orange hover:bg-primary/90"
          >
            <Plus size={16} className="mr-2" />
            ADD MONEY
          </Button>
        </motion.div>

        {/* Transaction History */}
        <section>
          <h2 className="font-gaming text-base tracking-widest text-muted-foreground uppercase mb-3">
            Transaction History
          </h2>
          <div
            data-ocid="wallet.transaction_list"
            className="gaming-card rounded-xl px-4"
          >
            {txLoading ? (
              <div className="py-4 space-y-3">
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-12 bg-muted rounded-lg" />
                ))}
              </div>
            ) : !txHistory || txHistory.length === 0 ? (
              <div data-ocid="wallet.empty_state" className="py-12 text-center">
                <Wallet
                  size={40}
                  className="text-muted-foreground/30 mx-auto mb-3"
                />
                <p className="font-gaming text-muted-foreground text-sm">
                  No transactions yet
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Add money to get started
                </p>
              </div>
            ) : (
              txHistory.map((tx, i) => (
                <TxRow key={tx.id.toString()} tx={tx} index={i} />
              ))
            )}
          </div>
        </section>
      </div>

      {/* Add Money Modal */}
      <Dialog open={addMoneyOpen} onOpenChange={handleModalClose}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-gaming text-xl flex items-center gap-2">
              <Wallet size={20} className="text-primary" />
              Add Money
            </DialogTitle>
          </DialogHeader>

          {!showQR ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="font-gaming text-sm tracking-wide text-muted-foreground">
                  AMOUNT (৳)
                </Label>
                <Input
                  data-ocid="wallet.addmoney_input"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-muted border-border font-mono text-lg h-12"
                  min="1"
                />
              </div>
              <Button
                data-ocid="wallet.confirm_add_button"
                onClick={handleAddMoneyClick}
                className="w-full bg-primary text-primary-foreground font-gaming tracking-widest h-12 glow-orange hover:bg-primary/90"
              >
                <QrCode size={16} className="mr-2" />
                SHOW QR CODE
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Scan QR code and complete payment of{" "}
                  <span className="text-primary font-mono font-bold">
                    ৳{amount}
                  </span>
                  , then click "I've Paid"
                </p>
                <div className="inline-block p-3 bg-white rounded-2xl">
                  <img
                    src="/assets/generated/payment-qr.dim_400x400.png"
                    alt="Payment QR Code"
                    className="w-56 h-56 object-contain"
                  />
                </div>
              </div>
              <Button
                data-ocid="wallet.paid_button"
                onClick={handlePaid}
                disabled={requestPayment.isPending}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-gaming tracking-widest h-12"
              >
                {requestPayment.isPending ? (
                  <Loader2 className="animate-spin mr-2" size={16} />
                ) : null}
                I'VE PAID
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowQR(false)}
                className="w-full text-muted-foreground"
              >
                Back
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
