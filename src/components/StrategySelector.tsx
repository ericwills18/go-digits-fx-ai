import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const STRATEGIES = [
  // Core Strategies
  { id: "trend-following", label: "Trend Following & Pullbacks", icon: "📈", category: "Core" },
  { id: "breakout-retest", label: "Breakout & Retest", icon: "🔓", category: "Core" },
  { id: "support-resistance", label: "Support & Resistance", icon: "📐", category: "Core" },
  { id: "supply-demand", label: "Supply & Demand Zones", icon: "🏦", category: "Core" },
  { id: "price-action", label: "Price Action Trading", icon: "🕯️", category: "Core" },
  // Advanced Strategies
  { id: "smart-money", label: "Smart Money Concepts (SMC)", icon: "🧠", category: "Advanced" },
  { id: "ict-precision", label: "ICT & Precision Trading", icon: "🎯", category: "Advanced" },
  { id: "liquidity-sweep", label: "Liquidity Sweep & Stop Hunt", icon: "💧", category: "Advanced" },
  { id: "kill-zones", label: "Kill Zones & Session Timing", icon: "⏰", category: "Advanced" },
  { id: "anchored-volume", label: "Anchored Volume Profile", icon: "📊", category: "Advanced" },
  // Candle & Pattern Strategies
  { id: "inside-bar", label: "Inside Bar Strategy", icon: "📦", category: "Patterns" },
  { id: "candle-range", label: "Candle Range Theory", icon: "📏", category: "Patterns" },
  { id: "indicator-confluence", label: "Indicator Confluence", icon: "🔗", category: "Patterns" },
  // Analysis Methods
  { id: "topdown-sr", label: "Top-Down (S&R Based)", icon: "🔍", category: "Analysis" },
  { id: "topdown-trendline", label: "Top-Down (Trendline Based)", icon: "📉", category: "Analysis" },
  { id: "mean-reversion", label: "Mean Reversion & Counter-Trend", icon: "🔄", category: "Analysis" },
  { id: "strategy-integration", label: "Strategy Integration & Confluence", icon: "🧩", category: "Analysis" },
  // Professional
  { id: "pro-routine", label: "Professional Trading Routine", icon: "🗓️", category: "Professional" },
  { id: "risk-management", label: "Risk Management Mastery", icon: "⚖️", category: "Professional" },
  { id: "trading-psychology", label: "Trading Psychology", icon: "🧘", category: "Professional" },
  // Automation
  { id: "build-indicator", label: "Build MT5 Indicator with AI", icon: "🤖", category: "Automation" },
  { id: "build-ea", label: "Build Expert Adviser with AI", icon: "⚙️", category: "Automation" },
];

interface StrategySelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StrategySelector({ selected, onSelect }: StrategySelectorProps) {
  const current = STRATEGIES.find((s) => s.id === selected);
  const [search, setSearch] = useState("");

  const filtered = search
    ? STRATEGIES.filter((s) => s.label.toLowerCase().includes(search.toLowerCase()))
    : STRATEGIES;

  const categories = [...new Set(filtered.map((s) => s.category))];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-foreground hover:bg-accent transition-all duration-200 outline-none">
        <span>{current ? `${current.icon} ${current.label}` : "📋 Select Strategy"}</span>
        <ChevronDown className="w-3 h-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card border-border shadow-xl w-[280px] max-h-[400px] overflow-y-auto">
        <div className="px-2 py-1.5 sticky top-0 bg-card z-10">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-border bg-secondary">
            <Search className="w-3 h-3 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search strategies..."
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
