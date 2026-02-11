import { BarChart3 } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
        <BarChart3 className="w-3.5 h-3.5 text-primary" />
      </div>
      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 bg-primary/40 rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-primary/40 rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-primary/40 rounded-full" />
      </div>
    </div>
  );
}
