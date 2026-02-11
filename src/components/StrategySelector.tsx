import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STRATEGIES = [
  { id: "trend-following", label: "Trend Following", icon: "📈" },
  { id: "breakout-retest", label: "Breakout & Retest", icon: "🔓" },
  { id: "support-resistance", label: "Support & Resistance", icon: "📐" },
  { id: "supply-demand", label: "Supply & Demand", icon: "🏦" },
  { id: "smart-money", label: "Smart Money Concepts", icon: "🧠" },
  { id: "price-action", label: "Price Action", icon: "🕯️" },
  { id: "indicator-confluence", label: "Indicator Confluence", icon: "📊" },
];

interface StrategySelectorProps {
  selected: string | null;
  onSelect: (id: string) => void;
}

export function StrategySelector({ selected, onSelect }: StrategySelectorProps) {
  const current = STRATEGIES.find((s) => s.id === selected);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/20 bg-white/10 text-xs text-primary-foreground hover:bg-white/20 transition-all duration-200 outline-none backdrop-blur-sm">
        <span>{current ? `${current.icon} ${current.label}` : "Select Strategy"}</span>
        <ChevronDown className="w-3 h-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-card border-border shadow-lg">
        {STRATEGIES.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`text-xs cursor-pointer transition-colors duration-150 ${selected === s.id ? "bg-accent font-medium" : ""}`}
          >
            <span className="mr-2">{s.icon}</span>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
