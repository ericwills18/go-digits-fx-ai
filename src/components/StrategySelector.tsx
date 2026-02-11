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
      <DropdownMenuTrigger className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-secondary text-xs text-secondary-foreground hover:bg-accent transition-colors outline-none">
        <span>{current ? `${current.icon} ${current.label}` : "Select Strategy"}</span>
        <ChevronDown className="w-3 h-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="bg-card border-border">
        {STRATEGIES.map((s) => (
          <DropdownMenuItem
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={`text-xs cursor-pointer ${selected === s.id ? "bg-accent" : ""}`}
          >
            <span className="mr-2">{s.icon}</span>
            {s.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
