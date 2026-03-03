import { MousePointer2, TrendingUp, Minus, Square, GitBranch, Trash2 } from "lucide-react";
import { DrawingTool } from "./types";

interface Props {
  activeTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  onClearAll: () => void;
}

const TOOLS: { id: DrawingTool; icon: React.ElementType; label: string }[] = [
  { id: "cursor", icon: MousePointer2, label: "Cursor" },
  { id: "trendline", icon: TrendingUp, label: "Trendline" },
  { id: "horizontal", icon: Minus, label: "Horizontal Line" },
  { id: "rectangle", icon: Square, label: "Rectangle" },
  { id: "fibonacci", icon: GitBranch, label: "Fibonacci" },
];

export function DrawingToolbar({ activeTool, onToolChange, onClearAll }: Props) {
  return (
    <div className="flex flex-col gap-1 p-1.5 bg-card border-r border-border">
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          onClick={() => onToolChange(tool.id)}
          className={`p-2 rounded-lg transition-all ${
            activeTool === tool.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          }`}
          title={tool.label}
        >
          <tool.icon className="w-4 h-4" />
        </button>
      ))}
      <div className="border-t border-border my-1" />
      <button
        onClick={onClearAll}
        className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        title="Clear all drawings"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
