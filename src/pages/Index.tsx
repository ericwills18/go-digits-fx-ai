import { useState, useRef, useEffect } from "react";
import { TrendingUp, RotateCcw } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { StrategySelector } from "@/components/StrategySelector";
import { streamChat, type Msg } from "@/lib/streamChat";
import { toast } from "sonner";

const WELCOME_MSG: Msg = {
  role: "assistant",
  content: `Welcome to **GO-DIGITS Forex AI** 📊

I'm your professional forex trading assistant. I can help you with:

- 📈 **Chart Analysis** — Upload a chart screenshot and I'll provide signals
- 📐 **Strategy Guidance** — Learn and apply proven trading strategies  
- 📚 **Forex Education** — From basics to advanced concepts
- ⚖️ **Risk Management** — Position sizing, stop-loss placement

**To get started:** Ask me anything about forex, or upload a chart screenshot for analysis. Select a strategy above for targeted signals.`,
};

export default function Index() {
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content: string, image?: string) => {
    const userMsg: Msg = { role: "user", content, image };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && prev.length > 1 && prev[prev.length - 2]?.role === "user") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        strategy: strategy || undefined,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      toast.error(e.message || "Failed to get response");
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MSG]);
    setStrategy(null);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">GO-DIGITS FOREX AI</h1>
            <p className="text-[10px] text-muted-foreground tracking-wider uppercase">Trading Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StrategySelector selected={strategy} onSelect={setStrategy} />
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto">
          {messages.map((msg, i) => (
            <ChatMessage key={i} role={msg.role} content={msg.content} image={msg.image} />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
        </div>
      </div>

      {/* Input */}
      <div className="max-w-3xl mx-auto w-full">
        <ChatInput onSend={handleSend} disabled={isLoading} />
      </div>
    </div>
  );
}
