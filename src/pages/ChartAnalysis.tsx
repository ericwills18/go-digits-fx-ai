import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ExternalLink, Maximize2, Send, Upload, X, CheckCircle2,
  XCircle, AlertTriangle, RotateCcw, Loader2, ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  checklist_steps: string[];
  risk_rules: string[];
  screenshot_requirements: string[];
  ai_prompt_template: string | null;
  timeframe: string | null;
  assets: string | null;
}

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

interface ReviewResult {
  checklist_audit?: { step: string; status: string; note: string }[];
  chart_summary?: { bias: string; structure: string; key_levels: string[] };
  trade_validation?: { entry_quality: string; invalidation: string; targets: string[] };
  risk_review?: { rr: string; warnings: string[]; max_loss: string; position_size: string };
  corrections?: string[];
  follow_up_questions?: string[];
  raw?: string;
}

const SYMBOLS = ["BINANCE:BTCUSDT", "BINANCE:ETHUSDT", "FX:EURUSD", "FX:GBPUSD", "FX:USDJPY", "TVC:GOLD", "FX:AUDUSD"];
const INTERVALS = [
  { label: "15m", value: "15" },
  { label: "1h", value: "60" },
  { label: "4h", value: "240" },
  { label: "1D", value: "D" },
];

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chart-review`;

export default function ChartAnalysis() {
  const navigate = useNavigate();
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<boolean[]>([]);
  const [symbol, setSymbol] = useState("BINANCE:BTCUSDT");
  const [interval, setInterval] = useState("60");
  const widgetRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Risk inputs
  const [accountSize, setAccountSize] = useState("");
  const [riskPercent, setRiskPercent] = useState("1");
  const [entryPrice, setEntryPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [tpPrice, setTpPrice] = useState("");

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Screenshot review
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);

  // Load strategies
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("strategies")
        .select("*");
      if (error) {
        toast.error("Failed to load strategies");
        return;
      }
      if (data) {
        setStrategies(data as unknown as Strategy[]);
      }
    })();
  }, []);

  // TradingView widget
  useEffect(() => {
    if (!widgetRef.current) return;
    widgetRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if ((window as any).TradingView) {
        new (window as any).TradingView.widget({
          container_id: widgetRef.current!.id,
          symbol,
          interval,
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#0a0e17",
          enable_publishing: false,
          allow_symbol_change: true,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: true,
          autosize: true,
          studies: [],
        });
      }
    };
    document.head.appendChild(script);
    return () => {
      try { document.head.removeChild(script); } catch {}
    };
  }, [symbol, interval]);

  // Select strategy
  const handleSelectStrategy = (id: string) => {
    const s = strategies.find((s) => s.id === id) || null;
    setSelectedStrategy(s);
    setCheckedSteps(new Array(s?.checklist_steps?.length || 0).fill(false));
    setReviewResult(null);
  };

  // Risk calculations
  const rr = (() => {
    const e = parseFloat(entryPrice);
    const sl = parseFloat(slPrice);
    const tp = parseFloat(tpPrice);
    if (!e || !sl || !tp || e === sl) return null;
    const risk = Math.abs(e - sl);
    const reward = Math.abs(tp - e);
    return (reward / risk).toFixed(2);
  })();

  const riskAmount = (() => {
    const acc = parseFloat(accountSize);
    const pct = parseFloat(riskPercent);
    if (!acc || !pct) return null;
    return (acc * pct / 100).toFixed(2);
  })();

  // Chat send
  const sendChat = useCallback(async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMsg: ChatMsg = { role: "user", content: chatInput.trim() };
    const newMsgs = [...chatMessages, userMsg];
    setChatMessages(newMsgs);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const resp = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          strategy_id: selectedStrategy?.id || null,
          chat_messages: newMsgs.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "AI error");
        setIsChatLoading(false);
        return;
      }

      // Stream response
      const reader = resp.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantContent = "";

      setChatMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setChatMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { role: "assistant", content: assistantContent };
                return copy;
              });
            }
          } catch {}
        }
      }
    } catch (e) {
      toast.error("Failed to send message");
    }
    setIsChatLoading(false);
  }, [chatInput, chatMessages, isChatLoading, selectedStrategy]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Screenshot handling
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    setScreenshotFile(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCrossCheck = async () => {
    if (!selectedStrategy) { toast.error("Select a strategy first"); return; }
    if (!entryPrice || !slPrice || !tpPrice) { toast.error("Fill in Entry, SL, and TP"); return; }
    if (!screenshotFile) { toast.error("Upload a chart screenshot"); return; }

    setIsReviewing(true);
    setReviewResult(null);

    try {
      // Upload screenshot
      const fileName = `${Date.now()}-${screenshotFile.name}`;
      const { error: uploadErr } = await supabase.storage
        .from("chart-screenshots")
        .upload(fileName, screenshotFile);
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from("chart-screenshots")
        .getPublicUrl(fileName);

      const resp = await fetch(EDGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          strategy_id: selectedStrategy.id,
          entry_price: entryPrice,
          stop_loss_price: slPrice,
          take_profit_price: tpPrice,
          account_size: accountSize || undefined,
          risk_percent: riskPercent || undefined,
          timeframe: INTERVALS.find(i => i.value === interval)?.label,
          symbol,
          screenshot_url: urlData.publicUrl,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        toast.error(err.error || "Review failed");
        setIsReviewing(false);
        return;
      }

      const result = await resp.json();
      setReviewResult(result);
    } catch (e: any) {
      toast.error(e.message || "Review failed");
    }
    setIsReviewing(false);
  };

  const statusIcon = (status: string) => {
    if (status === "pass") return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    if (status === "fail") return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  };

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Top bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm font-semibold">Chart Analysis</span>
        <div className="ml-auto flex items-center gap-2">
          <Select value={symbol} onValueChange={setSymbol}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SYMBOLS.map((s) => (
                <SelectItem key={s} value={s}>{s.replace("BINANCE:", "").replace("FX:", "").replace("TVC:", "")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={interval} onValueChange={setInterval}>
            <SelectTrigger className="w-[80px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVALS.map((i) => (
                <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open("https://www.tradingview.com/chart/", "_blank", "noopener,noreferrer")}>
            <ExternalLink className="w-3 h-3 mr-1" /> TradingView
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Chart */}
        <div className="flex-1 min-h-[300px] md:min-h-0 relative">
          <div id="tv-chart-widget" ref={widgetRef} className="absolute inset-0" />
          <p className="absolute bottom-2 left-2 text-[10px] text-muted-foreground/50 pointer-events-none">
            Practice analysis. Educational coaching. Not financial advice.
          </p>
        </div>

        {/* AI Sidebar */}
        <div className="w-full md:w-[380px] lg:w-[420px] border-t md:border-t-0 md:border-l border-border flex flex-col bg-card/50 backdrop-blur-sm">
          <Tabs defaultValue="strategy" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-9">
              <TabsTrigger value="strategy" className="text-xs flex-1">Strategy</TabsTrigger>
              <TabsTrigger value="risk" className="text-xs flex-1">Risk</TabsTrigger>
              <TabsTrigger value="chat" className="text-xs flex-1">Chat</TabsTrigger>
              <TabsTrigger value="review" className="text-xs flex-1">Review</TabsTrigger>
            </TabsList>

            {/* Strategy Tab */}
            <TabsContent value="strategy" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  <Select onValueChange={handleSelectStrategy} value={selectedStrategy?.id || ""}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Select a strategy..." />
                    </SelectTrigger>
                    <SelectContent>
                      {strategies.map((s) => (
                        <SelectItem key={s.id} value={s.id} className="text-xs">
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedStrategy && (
                    <>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <p className="text-xs text-muted-foreground">{selectedStrategy.description}</p>
                        <div className="flex gap-2 mt-1.5">
                          {selectedStrategy.timeframe && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded">{selectedStrategy.timeframe}</span>
                          )}
                          {selectedStrategy.assets && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-accent/30 text-accent-foreground rounded">{selectedStrategy.assets}</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-xs font-semibold">Checklist</h4>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={() => setCheckedSteps(new Array(selectedStrategy.checklist_steps.length).fill(false))}>
                            <RotateCcw className="w-3 h-3 mr-1" /> Reset
                          </Button>
                        </div>
                        <div className="space-y-1.5">
                          {selectedStrategy.checklist_steps.map((step, i) => (
                            <label key={i} className="flex items-start gap-2 text-xs cursor-pointer group">
                              <Checkbox
                                checked={checkedSteps[i]}
                                onCheckedChange={(checked) => {
                                  const copy = [...checkedSteps];
                                  copy[i] = !!checked;
                                  setCheckedSteps(copy);
                                }}
                                className="mt-0.5"
                              />
                              <span className={checkedSteps[i] ? "line-through text-muted-foreground" : ""}>{step}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold mb-1.5">Risk Rules</h4>
                        <ul className="space-y-1">
                          {selectedStrategy.risk_rules.map((rule, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-primary mt-0.5">•</span>{rule}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Risk Tab */}
            <TabsContent value="risk" className="flex-1 overflow-hidden m-0">
              <ScrollArea className="h-full">
                <div className="p-3 space-y-3">
                  <h4 className="text-xs font-semibold">Trade Setup</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Account Size</label>
                      <Input className="h-8 text-xs" placeholder="e.g. 5000" value={accountSize} onChange={(e) => setAccountSize(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Risk %</label>
                      <Input className="h-8 text-xs" placeholder="1" value={riskPercent} onChange={(e) => setRiskPercent(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-[10px] text-muted-foreground">Entry Price *</label>
                      <Input className="h-8 text-xs" placeholder="Entry price" value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Stop Loss *</label>
                      <Input className="h-8 text-xs" placeholder="Stop loss price" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-[10px] text-muted-foreground">Take Profit *</label>
                      <Input className="h-8 text-xs" placeholder="Take profit price" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} />
                    </div>
                  </div>

                  <div className="p-2 bg-muted/30 rounded-lg space-y-1.5">
                    <h4 className="text-xs font-semibold">Calculations</h4>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">R:R Ratio</span>
                      <span className={`font-mono font-semibold ${rr && parseFloat(rr) >= 2 ? "text-green-500" : rr && parseFloat(rr) >= 1.5 ? "text-yellow-500" : rr ? "text-red-500" : "text-muted-foreground"}`}>
                        {rr ? `1:${rr}` : "—"}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Risk Amount</span>
                      <span className="font-mono">{riskAmount ? `$${riskAmount}` : "—"}</span>
                    </div>
                    {rr && parseFloat(rr) < 1.5 && (
                      <p className="text-[10px] text-red-400 mt-1">⚠️ R:R below 1:1.5 — consider adjusting your setup</p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden m-0">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {chatMessages.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      {selectedStrategy
                        ? `Ask anything about the ${selectedStrategy.name} strategy...`
                        : "Select a strategy to get contextual guidance, or ask any trading question."}
                    </p>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/50"
                      }`}>
                        {msg.role === "assistant" ? (
                          <div className="prose prose-xs prose-invert max-w-none">
                            <ReactMarkdown>{msg.content || "..."}</ReactMarkdown>
                          </div>
                        ) : msg.content}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </ScrollArea>
              <div className="p-2 border-t border-border flex gap-2">
                <Input
                  className="h-8 text-xs flex-1"
                  placeholder="Ask about your strategy..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendChat()}
                  disabled={isChatLoading}
                />
                <Button size="icon" className="h-8 w-8" onClick={sendChat} disabled={isChatLoading || !chatInput.trim()}>
                  {isChatLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </TabsContent>

            {/* Review Tab */}
            <TabsContent value="review" className="flex-1 flex flex-col overflow-hidden m-0">
              <ScrollArea className="flex-1">
                <div className="p-3 space-y-3">
                  {/* Screenshot requirements */}
                  {selectedStrategy?.screenshot_requirements?.length > 0 && (
                    <div className="p-2 bg-muted/30 rounded-lg">
                      <p className="text-[10px] font-semibold mb-1">Before you upload, ensure:</p>
                      <ul className="space-y-0.5">
                        {selectedStrategy.screenshot_requirements.map((req, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground">• {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Upload */}
                  <div className="space-y-2">
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {screenshotFile ? screenshotFile.name : "Upload chart screenshot"}
                      </span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                    {screenshotPreview && (
                      <div className="relative">
                        <img src={screenshotPreview} alt="Preview" className="w-full rounded-lg border border-border" />
                        <button
                          onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                          className="absolute top-1 right-1 p-1 bg-background/80 rounded-full"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  <Button
                    className="w-full h-9 text-xs"
                    onClick={handleCrossCheck}
                    disabled={isReviewing || !selectedStrategy || !screenshotFile || !entryPrice || !slPrice || !tpPrice}
                  >
                    {isReviewing ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> Analyzing...</> : "Cross-check my analysis"}
                  </Button>

                  {/* Review Result */}
                  {reviewResult && (
                    <div className="space-y-3">
                      {reviewResult.raw && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <div className="prose prose-xs prose-invert max-w-none">
                            <ReactMarkdown>{reviewResult.raw}</ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {reviewResult.checklist_audit && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1.5">Checklist Audit</h5>
                          <div className="space-y-1">
                            {reviewResult.checklist_audit.map((item, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[11px]">
                                {statusIcon(item.status)}
                                <div>
                                  <span className="font-medium">{item.step}</span>
                                  {item.note && <p className="text-muted-foreground mt-0.5">{item.note}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {reviewResult.chart_summary && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1">Chart Summary</h5>
                          <div className="text-[11px] space-y-0.5">
                            <p><span className="text-muted-foreground">Bias:</span> <span className="font-medium capitalize">{reviewResult.chart_summary.bias}</span></p>
                            <p><span className="text-muted-foreground">Structure:</span> {reviewResult.chart_summary.structure}</p>
                            {reviewResult.chart_summary.key_levels?.length > 0 && (
                              <p><span className="text-muted-foreground">Key Levels:</span> {reviewResult.chart_summary.key_levels.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {reviewResult.trade_validation && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1">Trade Validation</h5>
                          <div className="text-[11px] space-y-0.5">
                            <p><span className="text-muted-foreground">Entry Quality:</span> <span className="font-medium capitalize">{reviewResult.trade_validation.entry_quality}</span></p>
                            <p><span className="text-muted-foreground">Invalidation:</span> {reviewResult.trade_validation.invalidation}</p>
                            {reviewResult.trade_validation.targets?.length > 0 && (
                              <p><span className="text-muted-foreground">Targets:</span> {reviewResult.trade_validation.targets.join(", ")}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {reviewResult.risk_review && (
                        <div className="p-2 bg-muted/30 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1">Risk Review</h5>
                          <div className="text-[11px] space-y-0.5">
                            <p><span className="text-muted-foreground">R:R:</span> {reviewResult.risk_review.rr}</p>
                            {reviewResult.risk_review.max_loss && (
                              <p><span className="text-muted-foreground">Max Loss:</span> {reviewResult.risk_review.max_loss}</p>
                            )}
                            {reviewResult.risk_review.position_size && (
                              <p><span className="text-muted-foreground">Position Size:</span> {reviewResult.risk_review.position_size}</p>
                            )}
                            {reviewResult.risk_review.warnings?.map((w, i) => (
                              <p key={i} className="text-red-400">⚠️ {w}</p>
                            ))}
                          </div>
                        </div>
                      )}

                      {reviewResult.corrections && reviewResult.corrections.length > 0 && (
                        <div className="p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1 text-red-400">Corrections</h5>
                          <ol className="space-y-0.5 list-decimal list-inside">
                            {reviewResult.corrections.map((c, i) => (
                              <li key={i} className="text-[11px]">{c}</li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {reviewResult.follow_up_questions && reviewResult.follow_up_questions.length > 0 && (
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <h5 className="text-xs font-semibold mb-1">Follow-up Questions</h5>
                          <ul className="space-y-0.5">
                            {reviewResult.follow_up_questions.map((q, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground">• {q}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
