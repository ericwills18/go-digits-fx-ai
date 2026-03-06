import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, ChevronDown, ChevronUp, MessageSquare, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { streamChat, type Msg } from "@/lib/streamChat";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  timeframe: string | null;
  assets: string | null;
  checklist_steps: string[];
  risk_rules: string[];
}

export default function StrategyLibrary() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [chatStrategy, setChatStrategy] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Msg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    loadStrategies();
  }, []);

  const loadStrategies = async () => {
    const { data } = await supabase.from("strategies").select("*").order("name");
    setStrategies((data as any) || []);
    setLoading(false);
  };

  const openChat = (strategyName: string) => {
    setChatStrategy(strategyName);
    setChatMessages([{
      role: "assistant",
      content: `I'm ready to explain the **${strategyName}** strategy in detail. Ask me anything!\n\nWould you like me to generate a chart image to illustrate this strategy visually? 📊`,
    }]);
    setGeneratedImage(null);
  };

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: Msg = { role: "user", content: chatInput };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput("");
    setChatLoading(true);

    let assistantText = "";
    try {
      await streamChat({
        messages: newMsgs,
        strategy: chatStrategy || undefined,
        onDelta: (chunk) => {
          assistantText += chunk;
          setChatMessages([...newMsgs, { role: "assistant", content: assistantText }]);
        },
        onDone: () => setChatLoading(false),
      });
    } catch {
      toast.error("Failed to get response");
      setChatLoading(false);
    }
  };

  const generateChartImage = async (strategyName: string) => {
    setImageLoading(true);
    try {
      const CHART_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chart`;
      const res = await fetch(CHART_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ prompt: `${strategyName} forex trading strategy setup with clear entry, stop loss, and take profit levels marked on candlestick chart` }),
      });
      const data = await res.json();
      if (data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        toast.error("Could not generate image");
      }
    } catch {
      toast.error("Image generation failed");
    }
    setImageLoading(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(270,30%,6%)] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-sm font-bold tracking-wider uppercase text-purple-300">Strategy Library</h1>
        <div className="w-20" />
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-purple-400">Loading strategies...</div>
        ) : strategies.length === 0 ? (
          <div className="text-center py-16 text-purple-300/70">No strategies available yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {strategies.map(strat => (
              <div key={strat.id} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === strat.id ? null : strat.id)}
                  className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-purple-900/10 transition"
                >
                  <div>
                    <h3 className="font-bold text-sm">{strat.name}</h3>
                    {strat.timeframe && <p className="text-[10px] text-purple-400 mt-0.5">Timeframe: {strat.timeframe} {strat.assets ? `• ${strat.assets}` : ""}</p>}
                  </div>
                  {expanded === strat.id ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-purple-400" />}
                </button>

                {expanded === strat.id && (
                  <div className="px-5 pb-5 space-y-4 border-t border-purple-800/20 pt-4">
                    {strat.description && <p className="text-xs text-purple-200/80">{strat.description}</p>}

                    {strat.checklist_steps.length > 0 && (
                      <div>
                        <h4 className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">Checklist / Steps</h4>
                        <ol className="space-y-1.5">
                          {strat.checklist_steps.map((step, i) => (
                            <li key={i} className="text-xs text-purple-200/70 flex gap-2">
                              <span className="text-purple-500 font-mono text-[10px] mt-0.5">{i + 1}.</span>
                              {step}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {strat.risk_rules.length > 0 && (
                      <div>
                        <h4 className="text-[10px] text-purple-400 uppercase tracking-wider mb-2">Risk Rules</h4>
                        <ul className="space-y-1">
                          {strat.risk_rules.map((rule, i) => (
                            <li key={i} className="text-xs text-purple-200/70">⚠️ {rule}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => openChat(strat.name)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700/30 text-purple-300 text-xs hover:bg-purple-700/50 transition"
                      >
                        <MessageSquare className="w-3 h-3" /> Ask AI
                      </button>
                      <button
                        onClick={() => generateChartImage(strat.name)}
                        disabled={imageLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700/30 text-purple-300 text-xs hover:bg-purple-700/50 transition disabled:opacity-50"
                      >
                        <ImageIcon className="w-3 h-3" /> {imageLoading ? "Generating..." : "Show Chart Example"}
                      </button>
                    </div>

                    {generatedImage && expanded === strat.id && (
                      <div className="mt-3">
                        <img src={generatedImage} alt="Strategy chart" className="rounded-xl w-full max-h-64 object-contain bg-black/30" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat modal */}
        {chatStrategy && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
              <div className="px-5 py-4 border-b border-purple-800/20 flex items-center justify-between">
                <h3 className="font-bold text-sm">AI: {chatStrategy}</h3>
                <button onClick={() => setChatStrategy(null)} className="text-purple-400 hover:text-white text-xs">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-xs ${msg.role === "user" ? "text-right" : ""}`}>
                    <div className={`inline-block max-w-[85%] px-3 py-2 rounded-xl ${
                      msg.role === "user" ? "bg-purple-600/30 text-white" : "bg-purple-900/30 text-purple-200"
                    }`}>
                      {msg.role === "assistant" ? (
                        <div className="chat-prose"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                      ) : msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && <div className="text-xs text-purple-400">Thinking...</div>}
              </div>
              <div className="p-3 border-t border-purple-800/20 flex gap-2">
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendChat()}
                  placeholder="Ask about this strategy..."
                  className="flex-1 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-800/30 text-white text-xs focus:outline-none"
                />
                <button onClick={sendChat} disabled={chatLoading} className="px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-medium disabled:opacity-50">Send</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
