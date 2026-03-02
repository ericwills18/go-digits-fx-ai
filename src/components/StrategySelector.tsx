import { ChevronDown, Search, BookOpen, Target } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export const COURSES = [
  // Foundations
  { id: "about-forex", label: "About Forex / What is Forex?", icon: "🌍", category: "Foundations" },
  { id: "currency-pairs-terms", label: "Currency Pairs & Core Terms", icon: "💱", category: "Foundations" },
  { id: "platforms-tools-broker", label: "Platforms, Tools & Broker Setup", icon: "🖥️", category: "Foundations" },
  { id: "order-types-execution", label: "Order Types & Execution Mechanics", icon: "📋", category: "Foundations" },
  { id: "candlestick-basics", label: "Candlestick Basics & Candle Range Theory", icon: "🕯️", category: "Foundations" },
  { id: "trendlines-channels", label: "Trendlines & Channels", icon: "📐", category: "Foundations" },
  { id: "support-resistance-course", label: "Support & Resistance (Levels, Zones, Flips)", icon: "🧱", category: "Foundations" },
  { id: "trend-analysis", label: "Trend Analysis (HH/HL, LH/LL, Range States)", icon: "📊", category: "Foundations" },
  // Structure & Analysis
  { id: "market-structure", label: "Market Structure (BOS, ChoCH, MSS)", icon: "🏗️", category: "Structure & Analysis" },
  { id: "topdown-analysis", label: "Top-Down Analysis (Monthly → Intraday)", icon: "🔍", category: "Structure & Analysis" },
  { id: "candlestick-patterns", label: "Candlestick Pattern Playbooks", icon: "📕", category: "Structure & Analysis" },
  { id: "chart-patterns", label: "Chart Patterns (Reversal/Continuation/Traps)", icon: "📈", category: "Structure & Analysis" },
  // Indicators & Tools
  { id: "indicator-systems", label: "Indicator Systems (MA, MACD, RSI, ATR, BB)", icon: "🔧", category: "Indicators & Tools" },
  { id: "divergence-models", label: "Divergence Models (Regular/Hidden)", icon: "↔️", category: "Indicators & Tools" },
  { id: "fibonacci-frameworks", label: "Fibonacci Frameworks (Retracements, OTE)", icon: "🌀", category: "Indicators & Tools" },
  // Risk & Management
  { id: "risk-management", label: "Risk Management Systems", icon: "⚖️", category: "Risk & Management" },
  { id: "trade-management", label: "Trade Management (Partials, BE, Trailing)", icon: "🎛️", category: "Risk & Management" },
  { id: "backtesting-journaling", label: "Backtesting, Journaling & Performance", icon: "📓", category: "Risk & Management" },
  { id: "trading-psychology", label: "Trading Psychology", icon: "🧘", category: "Risk & Management" },
  // Professional
  { id: "pro-routine", label: "Professional Trading Routine", icon: "🗓️", category: "Professional" },
  // Automation
  { id: "automation-coding", label: "Automation & Coding (Pine/MQL, Alerts)", icon: "🤖", category: "Automation" },
  { id: "build-indicator", label: "Build MT5 Indicator with AI", icon: "🔨", category: "Automation" },
  { id: "build-ea", label: "Build Expert Adviser with AI", icon: "⚙️", category: "Automation" },
];

export const STRATEGIES = [
  // Mechanical Strategies
  { id: "breakout-retest", label: "Breakout & Retest Strategy", icon: "🔓", category: "Mechanical" },
  { id: "range-break", label: "Range Breakout Strategy", icon: "📦", category: "Mechanical" },
  { id: "orb-strategy", label: "Opening Range Breakout (ORB)", icon: "🔔", category: "Mechanical" },
  { id: "volatility-squeeze", label: "Volatility Squeeze Strategy", icon: "🔥", category: "Mechanical" },
  { id: "mean-reversion", label: "Mean Reversion (Bands, RSI, VWAP)", icon: "🔄", category: "Mechanical" },
  { id: "trend-following", label: "Trend Following & Pullbacks", icon: "📈", category: "Mechanical" },
  // Price Action
  { id: "price-action", label: "Price Action Trading", icon: "🕯️", category: "Price Action" },
  { id: "support-resistance", label: "Support & Resistance Trading", icon: "📐", category: "Price Action" },
  { id: "supply-demand", label: "Supply & Demand Zones", icon: "🏦", category: "Price Action" },
  { id: "inside-bar", label: "Inside Bar Strategy", icon: "📦", category: "Price Action" },
  { id: "candle-range", label: "Candle Range Theory", icon: "📏", category: "Price Action" },
  // Smart Money / ICT
  { id: "smart-money", label: "Smart Money Concepts (Full Model)", icon: "🧠", category: "Smart Money" },
  { id: "ict-precision", label: "ICT Concepts (Kill Zones, AMD, Silver Bullet)", icon: "🎯", category: "Smart Money" },
  { id: "order-blocks", label: "Order Block Strategy", icon: "🧱", category: "Smart Money" },
  { id: "liquidity-sweep", label: "Liquidity Sweep & Stop Hunt", icon: "💧", category: "Smart Money" },
  { id: "fvg-imbalance", label: "Fair Value Gaps / Imbalance Strategy", icon: "📊", category: "Smart Money" },
  // Session-Based
  { id: "kill-zones", label: "Kill Zones & Session Timing", icon: "⏰", category: "Session-Based" },
  { id: "session-trading", label: "Session Trading (Asia, London, NY)", icon: "🌐", category: "Session-Based" },
  // Analysis & Integration
  { id: "indicator-confluence", label: "Indicator Confluence Strategy", icon: "🔗", category: "Analysis" },
  { id: "strategy-integration", label: "Strategy Integration & Confluence", icon: "🧩", category: "Analysis" },
  { id: "topdown-sr", label: "Top-Down (S&R Based)", icon: "🔍", category: "Analysis" },
  { id: "topdown-trendline", label: "Top-Down (Trendline Based)", icon: "📉", category: "Analysis" },
  { id: "anchored-volume", label: "Anchored Volume Profile", icon: "📊", category: "Analysis" },
];

// Combined for backward compatibility
export const ALL_ITEMS = [...COURSES, ...STRATEGIES];

interface SelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

function SelectorDropdown({ items, selected, onSelect, label, icon: Icon }: SelectorProps & { items: typeof COURSES; label: string; icon: any }) {
  const current = items.find((s) => s.id === selected);
  const [search, setSearch] = useState("");

  const filtered = search
    ? items.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : items;

  const categories = [...new Set(filtered.map((s) => s.category))];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground hover:bg-accent transition-all duration-200 outline-none">
        <Icon className="w-3 h-3 text-primary" />
        <span>{current ? `${current.icon} ${current.label}` : label}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card border-border shadow-xl w-[300px] max-h-[400px] overflow-y-auto">
        <div className="px-2 py-1.5 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-secondary">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="bg-transparent text-xs outline-none flex-1 text-foreground placeholder:text-muted-foreground"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
        {categories.map((cat) => (
          <div key={cat}>
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 py-1">
              {cat}
            </DropdownMenuLabel>
            {filtered
              .filter((s) => s.category === cat)
              .map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onClick={() => { onSelect(s.id); setSearch(""); }}
                  className={`text-xs cursor-pointer transition-colors duration-150 ${selected === s.id ? "bg-accent text-accent-foreground font-medium" : ""}`}
                >
                  <span className="mr-2">{s.icon}</span>
                  {s.label}
                </DropdownMenuItem>
              ))}
            <DropdownMenuSeparator />
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function CourseSelector({ selected, onSelect }: SelectorProps) {
  return <SelectorDropdown items={COURSES} selected={selected} onSelect={onSelect} label="📚 Courses" icon={BookOpen} />;
}

export function StrategySelector({ selected, onSelect }: SelectorProps) {
  return <SelectorDropdown items={STRATEGIES} selected={selected} onSelect={onSelect} label="🎯 Strategies" icon={Target} />;
}
