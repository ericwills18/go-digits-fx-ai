import { useState, useRef, useEffect, useCallback } from "react";
import { BarChart3, RotateCcw, Sparkles, MessageSquare, BookOpen, GraduationCap, Target, ChevronLeft, ChevronRight, LogOut, Trash2, ClipboardCheck } from "lucide-react";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { TypingIndicator } from "@/components/TypingIndicator";
import { CourseSelector, StrategySelector, COURSES, STRATEGIES, ALL_ITEMS } from "@/components/StrategySelector";
import { ThemeCustomizer } from "@/components/ThemeCustomizer";
import { streamChat, type Msg } from "@/lib/streamChat";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import aiAvatar from "@/assets/ai-avatar.jpeg";

const WELCOME_MSG: Msg = {
  role: "assistant",
  content: `Welcome to **Asphalt FX Academy** 🎓

I'm your AI Learning Assistant — here to guide you through structured courses step-by-step, from **Beginner** to **Professional** mastery.

Here's how it works:

1. 📚 **Select a Course** — Pick a course from the dropdown above
2. 🎯 **Choose a Strategy** — Select your learning strategy
3. 💬 **Learn Interactively** — I'll teach you module by module with exercises, checkpoints, and progress tracking
4. 📊 **Track Progress** — Click "Track My Progress" anytime to see how far you've come

**To get started:** Select a course above, and I'll begin your personalized onboarding!`,
};

const QUICK_ACTIONS = [
  { label: "Browse courses", icon: BookOpen, prompt: "Show me all available courses with a brief description of each so I can decide which one to start with." },
  { label: "Track my progress", icon: ClipboardCheck, prompt: "Track My Progress — Show me my learning progress dashboard with all enrolled courses, current levels, completed modules, and overall percentage." },
  { label: "Continue learning", icon: GraduationCap, prompt: "I want to continue where I left off. What's my current module and next task?" },
  { label: "Learning strategies", icon: Target, prompt: "Explain the different learning strategies available and help me choose the best one for my goals." },
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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("asphalt-fx-dark") === "true";
    }
    return false;
  });
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("asphalt-fx-theme") || "navy");
  const [wallpaper, setWallpaper] = useState(() => localStorage.getItem("asphalt-fx-wallpaper") || "");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasConversation = messages.length > 1;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("asphalt-fx-dark", String(isDark));
  }, [isDark]);

  const handleThemeChange = (theme: { id: string; primary: string; sidebar: string; navy: string }) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--sidebar-background", theme.sidebar);
    root.style.setProperty("--sidebar-primary", theme.primary);
    root.style.setProperty("--navy", theme.navy);
    root.style.setProperty("--ring", theme.primary);
    root.style.setProperty("--glow", theme.primary);
    setCurrentTheme(theme.id);
    localStorage.setItem("asphalt-fx-theme", theme.id);
  };

  const handleWallpaperChange = (url: string) => {
    setWallpaper(url);
    localStorage.setItem("asphalt-fx-wallpaper", url);
  };

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
    setTimeout(() => inputRef.current?.focus(), 100);

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
          if (convoId && assistantSoFar) {
            await supabase.from("messages").insert({
              conversation_id: convoId,
              role: "assistant",
              content: assistantSoFar,
            });
          }
          loadConversations();
          setTimeout(() => inputRef.current?.focus(), 100);
        },
      });
    } catch (e: any) {
      console.error(e);
      setIsLoading(false);
      toast.error(e.message || "Failed to get response");
    }
  };

  const prevStrategyRef = useRef<string | null>(null);
  useEffect(() => {
    if (strategy && strategy !== prevStrategyRef.current && !isLoading) {
      const strat = ALL_ITEMS.find((s) => s.id === strategy);
      if (strat) {
        const autoMessage = `I've selected the course/strategy "${strat.label}". Please begin my onboarding: ask me about my familiarity with this topic, how much time I can dedicate, my preferred learning pace, and my goal for taking this course.`;
        handleSend(autoMessage);
      }
    }
    prevStrategyRef.current = strategy;
  }, [strategy]);

  const handleReset = () => {
    setMessages([WELCOME_MSG]);
    setStrategy(null);
    setActiveConvoId(null);
  };

  const selectedStrategy = ALL_ITEMS.find((s) => s.id === strategy);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-0"} transition-all duration-300 overflow-hidden flex-shrink-0 sidebar-glass flex flex-col relative z-10`}
      >
        <div className="p-4 flex items-center gap-2.5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-primary/30 ai-avatar-glow">
            <img src={aiAvatar} alt="Asphalt FX Academy" className="w-full h-full object-cover" />
          </div>
          <span className="text-sm font-bold text-white tracking-tight">Asphalt FX Academy</span>
        </div>

        <div className="p-3 space-y-1.5">
          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[hsl(var(--sidebar-primary))] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Start new lesson
          </button>
          <button
            onClick={() => handleSend("Track My Progress — Show me my learning progress dashboard with all enrolled courses, current levels, completed modules, and overall percentage.")}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-[hsl(var(--sidebar-border))] text-white/70 text-xs font-medium hover:bg-white/5 hover:text-white transition-all disabled:opacity-50"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Track My Progress
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

        <div className="p-3 border-t border-[hsl(var(--sidebar-border))]">
          <p className="text-[9px] text-white/30 text-center mb-2">Founded by Williams Eric</p>
          <div className="flex items-center gap-2 px-2">
            <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold text-white">
              {user?.email?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">{user?.email?.split("@")[0] || "Learner"}</p>
              <p className="text-[10px] text-white/40">Asphalt FX Student</p>
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
      <main
        className="flex-1 flex flex-col min-w-0 relative z-10 wallpaper-bg"
        style={wallpaper ? { backgroundImage: `url(${wallpaper})` } : undefined}
      >
        {wallpaper && <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-0" />}

        {/* Top bar */}
        <header className="relative z-10 flex items-center justify-between px-5 py-3 border-b border-border bg-card/80 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <CourseSelector selected={strategy} onSelect={setStrategy} />
            <StrategySelector selected={strategy} onSelect={setStrategy} />
            {selectedStrategy && (
              <span className="text-xs text-primary font-medium px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                📖 Learning: {selectedStrategy.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <ThemeCustomizer
              onThemeChange={handleThemeChange}
              onDarkModeToggle={() => setIsDark(!isDark)}
              onWallpaperChange={handleWallpaperChange}
              isDark={isDark}
              currentTheme={currentTheme}
              currentWallpaper={wallpaper}
            />
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
        <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto">
          {!hasConversation ? (
            <div className="flex flex-col items-center justify-center h-full px-4 animate-fade-in-up">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 ai-avatar-glow mb-6">
                <img src={aiAvatar} alt="Asphalt FX Academy" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2 text-center">
                Ready to learn? Let's begin.
              </h1>
              <p className="text-sm text-muted-foreground mb-8 text-center max-w-md">
                Your AI-powered learning assistant — by Asphalt FX Academy
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
        <div className="relative z-10 max-w-3xl mx-auto w-full px-4 pb-4">
          <ChatInput onSend={handleSend} disabled={isLoading} inputRef={inputRef} />
        </div>
      </main>
    </div>
  );
}
