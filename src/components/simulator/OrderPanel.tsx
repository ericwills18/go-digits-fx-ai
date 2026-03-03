import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SimStrategy, TradePosition, CoachMessage } from "./types";
import { ArrowUpCircle, ArrowDownCircle, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Props {
  strategy: SimStrategy | null;
  currentPrice: number;
  balance: number;
  equity: number;
  riskPercent: number;
  spread: number;
  coachMode: "guided" | "silent";
  checklist: boolean[];
  onChecklistToggle: (index: number) => void;
  onPlaceOrder: (order: Omit<TradePosition, "id" | "openTime" | "status">) => void;
  coachMessages: CoachMessage[];
  positions: TradePosition[];
}

export function OrderPanel({
  strategy,
  currentPrice,
  balance,
  riskPercent,
  spread,
  coachMode,
  checklist,
  onChecklistToggle,
  onPlaceOrder,
  coachMessages,
  positions,
}: Props) {
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [lots, setLots] = useState(0.01);
  const [slPips, setSlPips] = useState(20);
  const [tpPips, setTpPips] = useState(40);

  const pipValue = currentPrice > 100 ? 0.01 : 0.0001; // Gold vs Forex
  const sl = orderType === "buy" ? currentPrice - slPips * pipValue : currentPrice + slPips * pipValue;
  const tp = orderType === "buy" ? currentPrice + tpPips * pipValue : currentPrice - tpPips * pipValue;
  const riskAmount = (balance * riskPercent) / 100;
  const rr = tpPips / slPips;

  const handlePlace = () => {
    const askPrice = currentPrice + spread * pipValue;
    const bidPrice = currentPrice;
    onPlaceOrder({
      type: orderType,
      entryPrice: orderType === "buy" ? askPrice : bidPrice,
      sl: Math.round(sl * 100000) / 100000,
      tp: Math.round(tp * 100000) / 100000,
      lots,
      pnl: 0,
    });
  };

  const recentCoach = coachMessages.slice(-3);
  const openPositions = positions.filter((p) => p.status === "open");

  return (
    <div className="w-72 flex flex-col bg-card border-l border-border overflow-y-auto">
      {/* Strategy header */}
      {strategy && (
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{strategy.icon}</span>
            <h3 className="text-xs font-bold text-foreground">{strategy.name}</h3>
          </div>
          <p className="text-[10px] text-muted-foreground">{strategy.description}</p>
        </div>
      )}

      {/* Checklist */}
      {strategy && strategy.checklist.length > 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Checklist</p>
          <div className="space-y-1.5">
            {strategy.checklist.map((item, i) => (
              <button
                key={i}
                onClick={() => onChecklistToggle(i)}
                className="flex items-center gap-2 w-full text-left group"
              >
                {checklist[i] ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-bull shrink-0" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 group-hover:text-muted-foreground" />
                )}
                <span className={`text-[11px] ${checklist[i] ? "text-foreground" : "text-muted-foreground"}`}>
                  {item}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Order ticket */}
      <div className="p-3 border-b border-border space-y-3">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Order Ticket</p>

        {/* Buy/Sell toggle */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => setOrderType("buy")}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              orderType === "buy"
                ? "bg-bull text-white"
                : "bg-secondary text-muted-foreground hover:bg-accent"
            }`}
          >
            <ArrowUpCircle className="w-3.5 h-3.5 inline mr-1" />
            BUY
          </button>
          <button
            onClick={() => setOrderType("sell")}
            className={`py-2 rounded-lg text-xs font-bold transition-all ${
              orderType === "sell"
                ? "bg-bear text-white"
                : "bg-secondary text-muted-foreground hover:bg-accent"
            }`}
          >
            <ArrowDownCircle className="w-3.5 h-3.5 inline mr-1" />
            SELL
          </button>
        </div>

        {/* Lots */}
        <div>
          <label className="text-[10px] text-muted-foreground">Lot Size</label>
          <div className="flex gap-1 mt-1">
            {[0.01, 0.05, 0.1, 0.5].map((l) => (
              <button
                key={l}
                onClick={() => setLots(l)}
                className={`flex-1 py-1.5 rounded text-[10px] font-medium transition-all ${
                  lots === l ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-accent"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* SL/TP */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-muted-foreground">SL (pips)</label>
            <input
              type="number"
              value={slPips}
              onChange={(e) => setSlPips(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground"
            />
          </div>
          <div>
            <label className="text-[10px] text-muted-foreground">TP (pips)</label>
            <input
              type="number"
              value={tpPips}
              onChange={(e) => setTpPips(Number(e.target.value))}
              className="w-full mt-1 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground"
            />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1 text-[10px] text-muted-foreground">
          <div className="flex justify-between">
            <span>Risk:</span>
            <span className="text-foreground">₦{riskAmount.toFixed(0)} ({riskPercent}%)</span>
          </div>
          <div className="flex justify-between">
            <span>R:R:</span>
            <span className={rr >= 1.5 ? "text-bull" : "text-bear"}>{rr.toFixed(1)}</span>
          </div>
          <div className="flex justify-between">
            <span>Entry:</span>
            <span className="text-foreground">{currentPrice.toFixed(currentPrice > 100 ? 2 : 5)}</span>
          </div>
          <div className="flex justify-between">
            <span>SL:</span>
            <span className="text-bear">{sl.toFixed(currentPrice > 100 ? 2 : 5)}</span>
          </div>
          <div className="flex justify-between">
            <span>TP:</span>
            <span className="text-bull">{tp.toFixed(currentPrice > 100 ? 2 : 5)}</span>
          </div>
        </div>

        <Button
          onClick={handlePlace}
          className={`w-full ${orderType === "buy" ? "bg-bull hover:bg-bull/90" : "bg-bear hover:bg-bear/90"} text-white`}
        >
          Place {orderType.toUpperCase()} Order
        </Button>
      </div>

      {/* Coach messages */}
      {coachMode === "guided" && recentCoach.length > 0 && (
        <div className="p-3 border-b border-border">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">AI Coach</p>
          <div className="space-y-2">
            {recentCoach.map((msg) => (
              <div
                key={msg.id}
                className={`p-2 rounded-lg text-[11px] ${
                  msg.type === "error"
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : msg.type === "warning"
                    ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20"
                    : msg.type === "success"
                    ? "bg-bull/10 text-bull border border-bull/20"
                    : "bg-primary/10 text-primary border border-primary/20"
                }`}
              >
                {msg.type === "warning" && <AlertTriangle className="w-3 h-3 inline mr-1" />}
                {msg.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Open positions summary */}
      {openPositions.length > 0 && (
        <div className="p-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Open ({openPositions.length})
          </p>
          <div className="space-y-1">
            {openPositions.map((p) => (
              <div key={p.id} className="flex justify-between text-[10px]">
                <span className={p.type === "buy" ? "text-bull" : "text-bear"}>
                  {p.type.toUpperCase()} {p.lots}
                </span>
                <span className={`font-medium ${(p.pnl || 0) >= 0 ? "text-bull" : "text-bear"}`}>
                  {(p.pnl || 0) >= 0 ? "+" : ""}₦{(p.pnl || 0).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
