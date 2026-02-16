import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart3, RotateCcw, Sparkles, MessageSquare, BookOpen, TrendingUp, Shield, ChevronLeft, ChevronRight, LogOut, Trash2, ExternalLink } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { StrategySelector } from "@/components/StrategySelector";
import { streamChat, type Msg } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const WELCOME_MSG: Msg = {
  role: "assistant",
  content: `Welcome to **GO-DIGITS Forex AI** 📊

I'm your professional forex trading assistant. I can help you with:

- 📈 **Chart Analysis** — Upload a chart screenshot and I'll provide signals
- 📐 **Strategy Guidance** — Learn and apply proven trading strategies  
- 📚 **Forex Education** — From basics to advanced concepts
- ⚖️ **Risk Management** — Position sizing, stop-loss placement

**To get started:** Ask me anything about forex, or upload a chart screenshot for analysis.`,
};

const QUICK_ACTIONS = [
  { label: "Analyze a chart", icon: TrendingUp, prompt: "I'd like to analyze a forex chart. What pair should I look at today?" },
  { label: "Risk management", icon: Shield, prompt: "Explain the key principles of risk management for forex trading" },
  { label: "Learn strategies", icon: BookOpen, prompt: "What are the most effective forex trading strategies for beginners?" },
  { label: "Market overview", icon: BarChart3, prompt: "Give me a current overview of major forex pairs and market conditions" },
];

type Conversation = { id: string; title: string; created_at: string };

export default function Index() {
  const { user, signOut } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([WELCOME_MSG]);
  const [isLoading, setIsLoading] = useState(false);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvoId, setActiveConvoId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasConversation = messages.length > 1;

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("conversations")
      .select("id, title, created_at")
      .order("updated_at", { ascending: false })
      .limit(50);
    if (data) setConversations(data);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const loadConversation = async (convoId: string) => {
    const { data } = await supabase
      .from("messages")
      .select("role, content, image")
      .eq("conversation_id", convoId)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setMessages([WELCOME_MSG, ...data.map((m: any) => ({ role: m.role, content: m.content, image: m.image }))]);
      setActiveConvoId(convoId);
    }
  };

  const deleteConversation = async (convoId: string) => {
    await supabase.from("conversations").delete().eq("id", convoId);
    if (activeConvoId === convoId) handleReset();
    loadConversations();
  };

  const handleSend = async (content: string, image?: string) => {
    const userMsg: Msg = { role: "user", content, image };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // Create or use conversation
    let convoId = activeConvoId;
    if (!convoId && user) {
      const title = content.slice(0, 60) || "New Chat";
      const { data } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (data) {
        convoId = data.id;
        setActiveConvoId(convoId);
      }
    }

    // Save user message
    if (convoId) {
      await supabase.from("messages").insert({
        conversation_id: convoId,
        role: "user",
        content,
        image: image || null,
      });
    }

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
        onDone: async () => {
          setIsLoading(false);
          // Save assistant message
          if (convoId && assistantSoFar) {
            await supabase.from("messages").insert({
              conversation_id: convoId,
              role: "assistant",
              content: assistantSoFar,
            });
          }
          loadConversations();
        },
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
    setActiveConvoId(null);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 sidebar-glass flex flex-col relative z-10`}
      >
        <div className="p-4 flex items-center gap-2.5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">GO-DIGITS</span>
        </div>

        <div className="p-3">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(var(--sidebar-primary))] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Start new chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-3">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 px-1">Recent</p>
          <div className="space-y-0.5">
            {conversations.map((chat) => (
              <div key={chat.id} className="group flex items-center">
                <button
                  onClick={() => loadConversation(chat.id)}
                  className={`flex-1 text-left px-2.5 py-2 rounded-lg text-xs transition-colors truncate ${
                    activeConvoId === chat.id ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/80"
                  }`}
                >
                  {chat.title}
                </button>
                <button
                  onClick={() => deleteConversation(chat.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-white/30 hover:text-red-400 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social links */}
        <div className="px-3 py-2 border-t border-[hsl(var(--sidebar-border))] space-y-1">
          <a
            href="https://chat.whatsapp.com/DWg229dkLER3cZnTLWFENM?mode=gi_c"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            WhatsApp Group
          </a>
          <a
            href="https://youtube.com/@go-digits?si=TaKJISOOC2mQuvAX"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
            YouTube Channel
          </a>
          <a
            href="https://one.exnesstrack.org/a/english_live?platform=mobile"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-white/60 hover:text-white hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Register on Exness
          </a>
        </div>

        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <p className="text-[9px] text-white/30 text-center mb-2">Founded by MR Olubori Paul</p>
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user?.email?.split("@")[0] || "Trader"}</p>
              <p className="text-[10px] text-white/40">GO-DIGITS Pro</p>
            </div>
            <button
              onClick={signOut}
              className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
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
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-1 rounded-r-md bg-[hsl(var(--navy))] border border-l-0 border-[hsl(var(--sidebar-border))] text-white/60 hover:text-white transition-colors"
        style={{ left: sidebarOpen ? "256px" : "0px", transition: "left 0.3s" }}
      >
        {sidebarOpen ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top bar */}
        <header className="flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <StrategySelector selected={strategy} onSelect={setStrategy} />
          </div>
          <div className="flex items-center gap-3">
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
            <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in-up">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                How can I help you trade today?
              </h1>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Your AI-powered forex assistant — by GO-DIGITS Academy
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-xl">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSend(action.prompt)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-xs text-foreground hover:bg-accent hover:border-primary/30 transition-all duration-200 disabled:opacity-50 shadow-sm"
                  >
                    <action.icon className="w-3.5 h-3.5 text-primary" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
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
