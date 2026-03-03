import { useState, useCallback, useRef, useEffect } from "react";
import { SimulatorChart } from "@/components/simulator/SimulatorChart";
import { StrategySetupModal } from "@/components/simulator/StrategySetupModal";
import { DrawingToolbar } from "@/components/simulator/DrawingToolbar";
import { OrderPanel } from "@/components/simulator/OrderPanel";
import { TopBar } from "@/components/simulator/TopBar";
import { BottomDrawer } from "@/components/simulator/BottomDrawer";
import { SAMPLE_DATA } from "@/components/simulator/sampleData";
import { SimStrategy, TradePosition, CoachMessage, JournalEntry, DrawingTool } from "@/components/simulator/types";
import { toast } from "sonner";

const SPREAD_PIPS: Record<string, number> = {
  EURUSD: 1.2,
  GBPUSD: 1.5,
  XAUUSD: 3.0,
  USDJPY: 1.3,
  GBPJPY: 2.5,
};

export default function Simulator() {
  const [showSetup, setShowSetup] = useState(true);
  const [asset, setAsset] = useState("EURUSD");
  const [timeframe, setTimeframe] = useState("M15");
  const [speed, setSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(100);
  const [balance, setBalance] = useState(5000);
  const [equity, setEquity] = useState(5000);
  const [strategy, setStrategy] = useState<SimStrategy | null>(null);
  const [coachMode, setCoachMode] = useState<"guided" | "silent">("guided");
  const [riskPercent, setRiskPercent] = useState(1);
  const [maxTrades, setMaxTrades] = useState(10);
  const [positions, setPositions] = useState<TradePosition[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([]);
  const [drawingTool, setDrawingTool] = useState<DrawingTool>("cursor");
  const [crosshairPrice, setCrosshairPrice] = useState<number | null>(null);
  const [checklist, setChecklist] = useState<boolean[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const candles = SAMPLE_DATA[asset] || SAMPLE_DATA["EURUSD"];
  const currentCandle = candles[Math.min(currentIndex - 1, candles.length - 1)];
  const currentPrice = currentCandle?.close || 0;
  const spread = SPREAD_PIPS[asset] || 1.5;

  // Setup complete handler
  const handleSetupComplete = useCallback(
    (config: {
      strategy: SimStrategy;
      coachMode: "guided" | "silent";
      riskPerTrade: number;
      maxTrades: number;
      balance: number;
    }) => {
      setStrategy(config.strategy);
      setCoachMode(config.coachMode);
      setRiskPercent(config.riskPerTrade);
      setMaxTrades(config.maxTrades);
      setBalance(config.balance);
      setEquity(config.balance);
      setChecklist(new Array(config.strategy.checklist.length).fill(false));
      setShowSetup(false);
      setIsPlaying(true);

      if (config.coachMode === "guided") {
        addCoachMessage("info", `Strategy loaded: ${config.strategy.name}. Complete the checklist before placing trades.`);
      }
    },
    []
  );

  // Add coach message helper
  const addCoachMessage = useCallback((type: CoachMessage["type"], message: string) => {
    setCoachMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type, message, timestamp: Date.now() },
    ]);
  }, []);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= candles.length) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, candles.length]);

  // Update equity based on open positions
  useEffect(() => {
    const pipValue = currentPrice > 100 ? 0.01 : 0.0001;
    let unrealizedPnl = 0;

    setPositions((prev) =>
      prev.map((p) => {
        if (p.status !== "open") return p;

        const priceDiff = p.type === "buy" ? currentPrice - p.entryPrice : p.entryPrice - currentPrice;
        const pips = priceDiff / pipValue;
        const pipVal = currentPrice > 100 ? 1 : 10; // rough pip value per lot
        const pnl = pips * pipVal * p.lots;

        // Check SL/TP hit
        if (p.type === "buy" && currentPrice <= p.sl) {
          return closeTrade(p, p.sl);
        }
        if (p.type === "buy" && currentPrice >= p.tp) {
          return closeTrade(p, p.tp);
        }
        if (p.type === "sell" && currentPrice >= p.sl) {
          return closeTrade(p, p.sl);
        }
        if (p.type === "sell" && currentPrice <= p.tp) {
          return closeTrade(p, p.tp);
        }

        unrealizedPnl += pnl;
        return { ...p, pnl };
      })
    );

    setEquity(balance + unrealizedPnl);
  }, [currentIndex, currentPrice]);

  const closeTrade = (p: TradePosition, closePrice: number): TradePosition => {
    const pipValue = closePrice > 100 ? 0.01 : 0.0001;
    const priceDiff = p.type === "buy" ? closePrice - p.entryPrice : p.entryPrice - closePrice;
    const pips = priceDiff / pipValue;
    const pipVal = closePrice > 100 ? 1 : 10;
    const pnl = pips * pipVal * p.lots;

    setBalance((prev) => prev + pnl);

    // Auto-journal
    const score = calculateStrategyScore(p);
    const mistakes = detectMistakes(p);
    setJournalEntries((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        trade: { ...p, closePrice, pnl, status: "closed" },
        strategyScore: score,
        mistakes,
        improvement: mistakes.length > 0 ? `Focus on: ${mistakes[0]}` : "Great execution!",
        timestamp: Date.now(),
      },
    ]);

    if (pnl >= 0) {
      addCoachMessage("success", `Trade closed in profit: +₦${pnl.toFixed(2)}`);
    } else {
      addCoachMessage("warning", `Trade closed at loss: ₦${pnl.toFixed(2)}`);
    }

    return { ...p, closePrice, closeTime: Date.now(), pnl, status: "closed" };
  };

  const calculateStrategyScore = (p: TradePosition): number => {
    let score = 50;
    const pipValue = currentPrice > 100 ? 0.01 : 0.0001;
    const slPips = Math.abs(p.entryPrice - p.sl) / pipValue;
    const tpPips = Math.abs(p.tp - p.entryPrice) / pipValue;
    const rr = tpPips / slPips;

    if (rr >= 2) score += 20;
    else if (rr >= 1.5) score += 10;
    else score -= 10;

    if (checklist.every(Boolean)) score += 20;
    else score -= checklist.filter((c) => !c).length * 5;

    if (slPips > 5 && slPips < 100) score += 10;
    return Math.max(0, Math.min(100, score));
  };

  const detectMistakes = (p: TradePosition): string[] => {
    const mistakes: string[] = [];
    const pipValue = currentPrice > 100 ? 0.01 : 0.0001;
    const slPips = Math.abs(p.entryPrice - p.sl) / pipValue;
    const tpPips = Math.abs(p.tp - p.entryPrice) / pipValue;
    const rr = tpPips / slPips;

    if (rr < 1) mistakes.push("R:R below 1:1");
    if (!checklist.every(Boolean) && strategy?.id !== "free-practice") {
      mistakes.push("Checklist incomplete");
    }
    if (slPips < 3) mistakes.push("SL too tight");
    if (slPips > 80) mistakes.push("SL too wide");

    return mistakes;
  };

  // Place order handler
  const handlePlaceOrder = useCallback(
    (order: Omit<TradePosition, "id" | "openTime" | "status">) => {
      // Coach validation
      if (coachMode === "guided" && strategy && strategy.id !== "free-practice") {
        if (!checklist.every(Boolean)) {
          addCoachMessage("error", "⛔ Complete your strategy checklist before placing a trade!");
          toast.error("Complete the strategy checklist first");
          return;
        }

        const pipValue = currentPrice > 100 ? 0.01 : 0.0001;
        const slPips = Math.abs(order.entryPrice - order.sl) / pipValue;
        const tpPips = Math.abs(order.tp - order.entryPrice) / pipValue;
        const rr = tpPips / slPips;

        if (rr < 1.5) {
          addCoachMessage("warning", `⚠️ R:R is ${rr.toFixed(1)} — below minimum 1.5. Consider widening TP or tightening SL.`);
        }

        // Check max trades
        const openCount = positions.filter((p) => p.status === "open").length;
        const closedCount = positions.filter((p) => p.status === "closed").length;
        if (maxTrades > 0 && openCount + closedCount >= maxTrades) {
          addCoachMessage("error", `⛔ Max trades (${maxTrades}) reached for this session.`);
          toast.error("Maximum trades reached");
          return;
        }

        // Revenge trading check
        const recentClosed = positions.filter((p) => p.status === "closed").slice(-2);
        if (recentClosed.length === 2 && recentClosed.every((p) => (p.pnl || 0) < 0)) {
          addCoachMessage("warning", "⚠️ Two consecutive losses detected. Take a moment before your next trade.");
        }
      }

      const newPosition: TradePosition = {
        ...order,
        id: crypto.randomUUID(),
        openTime: Date.now(),
        status: "open",
      };

      setPositions((prev) => [...prev, newPosition]);
      addCoachMessage("info", `📊 ${order.type.toUpperCase()} order placed at ${order.entryPrice.toFixed(currentPrice > 100 ? 2 : 5)}`);
      toast.success(`${order.type.toUpperCase()} order placed`);
    },
    [coachMode, strategy, checklist, positions, maxTrades, currentPrice, addCoachMessage]
  );

  const handleClosePosition = useCallback(
    (id: string) => {
      setPositions((prev) =>
        prev.map((p) => {
          if (p.id === id && p.status === "open") {
            return closeTrade(p, currentPrice);
          }
          return p;
        })
      );
    },
    [currentPrice]
  );

  const handleChecklistToggle = useCallback((index: number) => {
    setChecklist((prev) => prev.map((v, i) => (i === index ? !v : v)));
  }, []);

  const handleAssetChange = useCallback((a: string) => {
    setAsset(a);
    setCurrentIndex(100);
    setIsPlaying(false);
  }, []);

  const handleRewind = useCallback(() => {
    setCurrentIndex(100);
    setIsPlaying(false);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-background">
      <StrategySetupModal open={showSetup} onComplete={handleSetupComplete} />

      <TopBar
        asset={asset}
        timeframe={timeframe}
        speed={speed}
        isPlaying={isPlaying}
        balance={balance}
        equity={equity}
        currentPrice={currentPrice}
        onAssetChange={handleAssetChange}
        onTimeframeChange={setTimeframe}
        onSpeedChange={setSpeed}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onRewind={handleRewind}
      />

      <div className="flex flex-1 min-h-0">
        {/* Left drawing tools */}
        <DrawingToolbar
          activeTool={drawingTool}
          onToolChange={setDrawingTool}
          onClearAll={() => toast.info("Drawings cleared")}
        />

        {/* Chart area */}
        <div className="flex-1 min-w-0 relative bg-background">
          <SimulatorChart
            candles={candles}
            visibleCount={currentIndex}
            onCrosshairMove={(price) => setCrosshairPrice(price)}
          />
          {/* Disclaimer overlay */}
          <div className="absolute bottom-2 left-2 text-[9px] text-muted-foreground/50 bg-background/60 px-2 py-1 rounded">
            ⚠️ Practice simulator. Educational coaching only. Not financial advice.
          </div>
        </div>

        {/* Right order panel */}
        <OrderPanel
          strategy={strategy}
          currentPrice={currentPrice}
          balance={balance}
          equity={equity}
          riskPercent={riskPercent}
          spread={spread}
          coachMode={coachMode}
          checklist={checklist}
          onChecklistToggle={handleChecklistToggle}
          onPlaceOrder={handlePlaceOrder}
          coachMessages={coachMessages}
          positions={positions}
        />
      </div>

      {/* Bottom drawer */}
      <BottomDrawer
        positions={positions}
        journalEntries={journalEntries}
        coachMessages={coachMessages}
        currentPrice={currentPrice}
        onClosePosition={handleClosePosition}
      />
    </div>
  );
}
