import { useState } from "react";
import { TradePosition, JournalEntry, CoachMessage } from "./types";
import { ChevronUp, ChevronDown, BookOpen, MessageSquare, BarChart3, List } from "lucide-react";

interface Props {
  positions: TradePosition[];
  journalEntries: JournalEntry[];
  coachMessages: CoachMessage[];
  currentPrice: number;
  onClosePosition: (id: string) => void;
}

type Tab = "positions" | "pending" | "journal" | "coach";

export function BottomDrawer({ positions, journalEntries, coachMessages, currentPrice, onClosePosition }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("positions");

  const openPositions = positions.filter((p) => p.status === "open");
  const closedPositions = positions.filter((p) => p.status === "closed");
  const decimals = currentPrice > 100 ? 2 : 5;

  const tabs: { id: Tab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "positions", label: "Positions", icon: List, count: openPositions.length },
    { id: "journal", label: "Journal", icon: BookOpen, count: closedPositions.length },
    { id: "coach", label: "AI Coach", icon: MessageSquare, count: coachMessages.length },
  ];

  return (
    <div className={`border-t border-border bg-card transition-all ${isOpen ? "h-48" : "h-9"}`}>
      {/* Tab bar */}
      <div className="flex items-center h-9 px-2 gap-1 border-b border-border">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setIsOpen(true); }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-medium transition-all ${
              tab === t.id && isOpen ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="w-3 h-3" />
            {t.label}
            {t.count ? (
              <span className="px-1.5 py-0.5 rounded-full bg-secondary text-[9px]">{t.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Content */}
      {isOpen && (
        <div className="overflow-y-auto h-[calc(100%-36px)] p-2">
          {tab === "positions" && (
            <div>
              {openPositions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4">No open positions</p>
              ) : (
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="text-muted-foreground border-b border-border">
                      <th className="text-left py-1 px-2">Type</th>
                      <th className="text-left py-1 px-2">Lots</th>
                      <th className="text-left py-1 px-2">Entry</th>
                      <th className="text-left py-1 px-2">SL</th>
                      <th className="text-left py-1 px-2">TP</th>
                      <th className="text-right py-1 px-2">P&L</th>
                      <th className="text-right py-1 px-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((p) => (
                      <tr key={p.id} className="border-b border-border/50">
                        <td className={`py-1.5 px-2 font-bold ${p.type === "buy" ? "text-bull" : "text-bear"}`}>
                          {p.type.toUpperCase()}
                        </td>
                        <td className="py-1.5 px-2 text-foreground">{p.lots}</td>
                        <td className="py-1.5 px-2 text-foreground font-mono">{p.entryPrice.toFixed(decimals)}</td>
                        <td className="py-1.5 px-2 text-bear font-mono">{p.sl.toFixed(decimals)}</td>
                        <td className="py-1.5 px-2 text-bull font-mono">{p.tp.toFixed(decimals)}</td>
                        <td className={`py-1.5 px-2 text-right font-mono font-bold ${(p.pnl || 0) >= 0 ? "text-bull" : "text-bear"}`}>
                          {(p.pnl || 0) >= 0 ? "+" : ""}₦{(p.pnl || 0).toFixed(2)}
                        </td>
                        <td className="py-1.5 px-2 text-right">
                          <button
                            onClick={() => onClosePosition(p.id)}
                            className="px-2 py-0.5 rounded bg-destructive/10 text-destructive text-[9px] font-medium hover:bg-destructive/20 transition-all"
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "journal" && (
            <div className="space-y-2">
              {closedPositions.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4">No closed trades yet</p>
              ) : (
                closedPositions.map((p) => {
                  const journal = journalEntries.find((j) => j.trade.id === p.id);
                  return (
                    <div key={p.id} className="p-2 rounded-lg border border-border bg-secondary/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[10px] font-bold ${p.type === "buy" ? "text-bull" : "text-bear"}`}>
                          {p.type.toUpperCase()} {p.lots} lots
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${(p.pnl || 0) >= 0 ? "text-bull" : "text-bear"}`}>
                          {(p.pnl || 0) >= 0 ? "+" : ""}₦{(p.pnl || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">
                        Entry: {p.entryPrice.toFixed(decimals)} → Close: {p.closePrice?.toFixed(decimals)}
                      </div>
                      {journal && (
                        <div className="mt-1 text-[9px]">
                          <span className="text-primary">Score: {journal.strategyScore}/100</span>
                          {journal.mistakes.length > 0 && (
                            <span className="text-destructive ml-2">⚠ {journal.mistakes.join(", ")}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === "coach" && (
            <div className="space-y-1.5">
              {coachMessages.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-4">AI Coach will provide feedback here</p>
              ) : (
                coachMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2 rounded-lg text-[11px] ${
                      msg.type === "error"
                        ? "bg-destructive/10 text-destructive"
                        : msg.type === "warning"
                        ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                        : msg.type === "success"
                        ? "bg-bull/10 text-bull"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {msg.message}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
