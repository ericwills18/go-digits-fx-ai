import { useState, useRef, useEffect } from "react";
import { BarChart3, RotateCcw, Sparkles, MessageSquare, BookOpen, TrendingUp, Shield, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { StrategySelector } from "@/components/StrategySelector";
import { streamChat, type Msg } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
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

const QUICK_ACTIONS = [
  { label: "Analyze a chart", icon: TrendingUp, prompt: "I'd like to analyze a forex chart. What pair should I look at today?" },
  { label: "Risk management", icon: Shield, prompt: "Explain the key principles of risk management for forex trading" },
  { label: "Learn strategies", icon: BookOpen, prompt: "What are the most effective forex trading strategies for beginners?" },
  { label: "Market overview", icon: BarChart3, prompt: "Give me a current overview of major forex pairs and market conditions" },
];

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
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chatHistory] = useState([
    { id: 1, title: "EUR/USD Analysis", time: "Today" },
    { id: 2, title: "Risk Management Guide", time: "Today" },
    { id: 3, title: "SMC Strategy Setup", time: "Yesterday" },
    { id: 4, title: "Gold Trade Signals", time: "Yesterday" },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasConversation = messages.length > 1;

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
    <div className="flex h-screen bg-background aurora-bg">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 border-r border-border bg-[hsl(var(--sidebar-background))] flex flex-col relative z-10`}
      >
        <div className="p-4 flex items-center gap-2.5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary" />
          </div>
          <span className="text-sm font-bold text-foreground tracking-tight">GO-DIGITS</span>
        </div>

        <div className="p-3">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Start new chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 px-1">Recent</p>
          <div className="space-y-0.5">
            {chatHistory.map((chat) => (
              <button
                key={chat.id}
                className="w-full text-left px-2.5 py-2 rounded-lg text-xs text-sidebar-foreground hover:bg-sidebar-accent transition-colors truncate"
              >
                {chat.title}
                <span className="block text-[10px] text-muted-foreground mt-0.5">{chat.time}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-primary/30 flex items-center justify-center text-[10px] font-bold text-primary">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-foreground truncate">{user?.email?.split("@")[0] || "Trader"}</p>
              <p className="text-[10px] text-muted-foreground">GO-DIGITS Pro</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-r-md bg-secondary border border-l-0 border-border text-muted-foreground hover:text-foreground transition-colors"
        style={{ left: sidebarOpen ? "256px" : "0px", transition: "left 0.3s" }}
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-background/50 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <StrategySelector selected={strategy} onSelect={setStrategy} />
          </div>
          <div className="flex items-center gap-3">
            {/* Ticker inline */}
            <div className="hidden md:flex items-center gap-4 text-[11px]">
              {TICKER_ITEMS.slice(0, 4).map((item) => (
                <span key={item.pair} className="flex items-center gap-1">
                  <span className="text-muted-foreground">{item.pair}</span>
                  <span className={item.bull ? "text-[hsl(var(--bull))]" : "text-[hsl(var(--bear))]"}>
                    {item.price}
                    <span className="text-[9px] ml-0.5">{item.bull ? "▲" : "▼"}</span>
                  </span>
                </span>
              ))}
            </div>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              title="New conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Messages or welcome */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {!hasConversation ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                How can I help you trade today?
              </h1>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Your AI-powered forex assistant with 18 professional strategies
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xl">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card/60 backdrop-blur-sm text-xs text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200 disabled:opacity-50"
                  >
                    <action.icon className="w-3.5 h-3.5 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>
              {/* Floating message */}
              <div className="glass-card rounded-2xl px-5 py-3 flex items-center gap-3 mb-6 max-w-md">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">
                  I'm waiting for your question...
                </p>
              </div>
            </div>
          ) : (
            /* Chat messages */
            <div className="px-4 py-6">
              <div className="max-w-3xl mx-auto space-y-1">
                {messages.slice(1).map((msg, i) => (
                  <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${Math.min(i * 50, 200)}ms` }}>
                    <ChatMessage role={msg.role} content={msg.content} image={msg.image} />
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && <TypingIndicator />}
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="max-w-3xl mx-auto w-full px-4 pb-4">
          <ChatInput onSend={handleSend} disabled={isLoading} />
        </div>
      </main>
    </div>
  );
}
