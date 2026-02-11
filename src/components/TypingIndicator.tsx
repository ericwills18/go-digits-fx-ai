import { TrendingUp } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0">
        <TrendingUp className="w-3.5 h-3.5 text-foreground" />
      </div>
      <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md flex items-center gap-1.5">
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
        <span className="typing-dot w-1.5 h-1.5 bg-muted-foreground rounded-full" />
      </div>
    </div>
  );
}
