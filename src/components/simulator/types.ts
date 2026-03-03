export interface Candle {
  time: number; // Unix timestamp in seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SimStrategy {
  id: string;
  name: string;
  icon: string;
  timeframe: string;
  assets: string;
  entryTrigger: string;
  slLogic: string;
  tpLogic: string;
  riskRule: string;
  orderTypes: string[];
  checklist: string[];
  description: string;
}

export interface TradePosition {
  id: string;
  type: "buy" | "sell";
  entryPrice: number;
  sl: number;
  tp: number;
  lots: number;
  openTime: number;
  closeTime?: number;
  closePrice?: number;
  pnl?: number;
  status: "open" | "closed" | "pending";
  strategyScore?: number;
  mistakes?: string[];
}

export interface SimulatorState {
  balance: number;
  equity: number;
  asset: string;
  timeframe: string;
  speed: number;
  isPlaying: boolean;
  currentCandleIndex: number;
  strategy: SimStrategy | null;
  coachMode: "guided" | "silent";
  riskPerTrade: number;
  maxTrades: number;
  positions: TradePosition[];
  journalEntries: JournalEntry[];
  coachMessages: CoachMessage[];
}

export interface JournalEntry {
  id: string;
  trade: TradePosition;
  strategyScore: number;
  mistakes: string[];
  improvement: string;
  timestamp: number;
}

export interface CoachMessage {
  id: string;
  type: "info" | "warning" | "error" | "success";
  message: string;
  timestamp: number;
}

export type DrawingTool = "cursor" | "trendline" | "horizontal" | "rectangle" | "fibonacci" | "delete";

export interface DrawingObject {
  id: string;
  tool: DrawingTool;
  points: { x: number; y: number }[];
  color: string;
}
