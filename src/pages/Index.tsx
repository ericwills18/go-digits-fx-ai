import { useState, useRef, useEffect } from "react";
import { TrendingUp, RotateCcw, BarChart3, Sparkles } from "lucide-react";
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

const TICKER_ITEMS = [
  { pair: "EUR/USD", price: "1.0872", bull: true },
  { pair: "GBP/USD", price: "1.2654", bull: false },
  { pair: "USD/JPY", price: "149.32", bull: true },
  { pair: "AUD/USD", price: "0.6543", bull: false },
  { pair: "USD/CAD", price: "1.3587", bull: true },
  { pair: "XAU/USD", price: "2,341.50", bull: true },
  { pair: "EUR/GBP", price: "0.8587", bull: false },
  { pair: "NZD/USD", price: "0.6123", bull: true },
];

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
      <header className="header-gradient flex items-center justify-between px-5 py-3.5 shadow-lg relative overflow-hidden">
        <div className="absolute inset-0 shimmer pointer-events-none" />
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <BarChart3 className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-primary-foreground flex items-center gap-1.5">
              GO-DIGITS FOREX AI
              <Sparkles className="w-3.5 h-3.5 text-primary-foreground/60" />
            </h1>
            <p className="text-[10px] text-primary-foreground/50 tracking-widest uppercase">Professional Trading Assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
          <StrategySelector selected={strategy} onSelect={setStrategy} />
          <button
            onClick={handleReset}
            className="p-2 rounded-lg text-primary-foreground/50 hover:text-primary-foreground hover:bg-white/10 transition-all duration-200 hover:rotate-[-90deg]"
            title="New conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Forex ticker bar */}
      <div className="relative overflow-hidden bg-card border-b border-border">
        <div className="ticker-scroll flex items-center gap-8 px-4 py-2 text-[11px] text-muted-foreground whitespace-nowrap w-max">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 hover:scale-105 transition-transform cursor-default">
              <span className="font-medium text-foreground/70">{item.pair}</span>
              <span className={`font-semibold ${item.bull ? 'text-bull' : 'text-bear'}`}>
                {item.price}
              </span>
              <span className={`text-[9px] ${item.bull ? 'text-bull' : 'text-bear'}`}>
                {item.bull ? '▲' : '▼'}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-1">
          {messages.map((msg, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}>
              <ChatMessage role={msg.role} content={msg.content} image={msg.image} />
            </div>
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
