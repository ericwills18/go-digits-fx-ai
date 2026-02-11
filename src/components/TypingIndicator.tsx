import { BarChart3 } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-fade-in-up">
      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
        <BarChart3 className="w-4 h-4 text-primary" />
      </div>
      <div className="glass-card px-5 py-3.5 rounded-2xl rounded-bl-sm flex items-center gap-2">
        <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
        <span className="typing-dot w-2 h-2 bg-primary/50 rounded-full" />
      </div>
    </div>
  );
}
