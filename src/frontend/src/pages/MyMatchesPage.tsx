import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, Clock, SearchX, Zap } from "lucide-react";
import { motion } from "motion/react";
import {
  type TournamentMatch,
  useRegisteredMatches,
} from "../hooks/useQueries";

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      data-ocid="matches.empty_state"
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <SearchX size={52} className="text-muted-foreground/30 mb-4" />
      <h3 className="font-gaming text-xl text-muted-foreground">
        No Live Match Found
      </h3>
      <p className="text-sm text-muted-foreground/60 mt-2">
        Register for tournaments to see your matches here
      </p>
    </motion.div>
  );
}

function MatchCard({
  match,
  index,
}: { match: TournamentMatch; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      data-ocid={`matches.item.${index + 1}`}
      className="gaming-card rounded-xl p-4 space-y-3"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="font-gaming text-base font-bold">{match.title}</p>
          <p className="text-xs text-muted-foreground">
            {match.mode} · {match.category}
          </p>
        </div>
        <Badge
          className={`font-gaming text-xs ${
            match.status === "live"
              ? "bg-green-500/20 text-green-400 border-green-500/30"
              : match.status === "upcoming"
                ? "bg-primary/20 text-primary border-primary/30"
                : "bg-muted text-muted-foreground border-border"
          }`}
          variant="outline"
        >
          {match.status.toUpperCase()}
        </Badge>
      </div>
      <div className="flex gap-4">
        <div>
          <p className="text-[10px] text-muted-foreground">ENTRY</p>
          <p className="font-mono text-sm text-primary">
            ৳{Number(match.entryFee)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">PRIZE</p>
          <p className="font-mono text-sm text-chart-3">
            ৳{Number(match.prizePool)}
          </p>
        </div>
        {match.roomId && (
          <div>
            <p className="text-[10px] text-muted-foreground">ROOM ID</p>
            <p className="font-mono text-sm">{match.roomId}</p>
          </div>
        )}
      </div>
      {match.roomPassword && (
        <div className="bg-muted/50 rounded-lg px-3 py-2 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Password:</span>
          <span className="font-mono text-sm text-primary">
            {match.roomPassword}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function MyMatchesPage() {
  const { data: allMatches, isLoading } = useRegisteredMatches();

  const upcoming = (allMatches || []).filter((m) => m.status === "upcoming");
  const live = (allMatches || []).filter((m) => m.status === "live");
  const completed = (allMatches || []).filter((m) => m.status === "completed");

  return (
    <div className="min-h-screen bg-background">
      <header className="px-4 pt-8 pb-4">
        <div className="h-1 w-12 bg-primary rounded-full mb-3" />
        <h1 className="font-gaming text-3xl font-extrabold tracking-tight">
          MY MATCHES
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Your tournament history
        </p>
      </header>

      <div className="px-4">
        <Tabs defaultValue="upcoming">
          <TabsList className="w-full bg-muted/50 border border-border mb-4">
            <TabsTrigger
              value="upcoming"
              data-ocid="matches.upcoming_tab"
              className="flex-1 font-gaming tracking-wide data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Clock size={14} className="mr-1" />
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value="live"
              data-ocid="matches.live_tab"
              className="flex-1 font-gaming tracking-wide data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              <Zap size={14} className="mr-1" />
              Live
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              data-ocid="matches.completed_tab"
              className="flex-1 font-gaming tracking-wide data-[state=active]:bg-secondary data-[state=active]:text-foreground"
            >
              <CheckCircle2 size={14} className="mr-1" />
              Done
            </TabsTrigger>
          </TabsList>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((n) => (
                <Skeleton key={n} className="h-28 rounded-xl bg-muted" />
              ))}
            </div>
          ) : (
            <>
              <TabsContent value="upcoming" className="mt-0">
                {upcoming.length === 0 ? (
                  <EmptyState />
                ) : (
                  upcoming.map((m, i) => (
                    <MatchCard key={m.id.toString()} match={m} index={i} />
                  ))
                )}
              </TabsContent>
              <TabsContent value="live" className="mt-0">
                {live.length === 0 ? (
                  <EmptyState />
                ) : (
                  live.map((m, i) => (
                    <MatchCard key={m.id.toString()} match={m} index={i} />
                  ))
                )}
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                {completed.length === 0 ? (
                  <EmptyState />
                ) : (
                  completed.map((m, i) => (
                    <MatchCard key={m.id.toString()} match={m} index={i} />
                  ))
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}
