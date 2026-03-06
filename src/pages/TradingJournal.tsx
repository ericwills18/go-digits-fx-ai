import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Upload, Camera, Trash2, TrendingUp, TrendingDown, Edit2, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TradeEntry {
  id: string;
  trade_date: string;
  asset: string;
  direction: "buy" | "sell";
  entry_price: number;
  stop_loss: number | null;
  take_profit: number | null;
  exit_price: number | null;
  lot_size: number | null;
  risk_percent: number | null;
  outcome: "win" | "loss" | "breakeven" | "open" | null;
  profit_loss: number | null;
  strategy_used: string | null;
  notes: string | null;
  screenshot_url: string | null;
  close_date: string | null;
  new_balance: number | null;
}

const EMPTY_FORM = {
  trade_date: new Date().toISOString().slice(0, 16),
  asset: "",
  direction: "buy" as "buy" | "sell",
  entry_price: "",
  stop_loss: "",
  take_profit: "",
  exit_price: "",
  lot_size: "",
  risk_percent: "",
  outcome: "open" as "win" | "loss" | "breakeven" | "open",
  profit_loss: "",
  strategy_used: "",
  notes: "",
  new_balance: "",
};

export default function TradingJournal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trades, setTrades] = useState<TradeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) loadTrades();
  }, [user]);

  const loadTrades = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trade_journal")
      .select("*")
      .eq("user_id", user.id)
      .order("trade_date", { ascending: false });
    setTrades((data as any) || []);
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshot(file);
    const reader = new FileReader();
    reader.onload = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!user || !form.asset || !form.entry_price) {
      toast.error("Asset and entry price are required");
      return;
    }
    setSaving(true);

    let screenshot_url: string | null = null;
    if (screenshot) {
      const ext = screenshot.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("journal-screenshots").upload(path, screenshot);
      if (!error) {
        const { data: urlData } = supabase.storage.from("journal-screenshots").getPublicUrl(path);
        screenshot_url = urlData.publicUrl;
      }
    }

    const entry = {
      user_id: user.id,
      trade_date: form.trade_date,
      asset: form.asset.toUpperCase(),
      direction: form.direction,
      entry_price: parseFloat(form.entry_price),
      stop_loss: form.stop_loss ? parseFloat(form.stop_loss) : null,
      take_profit: form.take_profit ? parseFloat(form.take_profit) : null,
      exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
      lot_size: form.lot_size ? parseFloat(form.lot_size) : null,
      risk_percent: form.risk_percent ? parseFloat(form.risk_percent) : null,
      outcome: form.outcome,
      profit_loss: form.profit_loss ? parseFloat(form.profit_loss) : null,
      strategy_used: form.strategy_used || null,
      notes: form.notes || null,
      screenshot_url: screenshot_url || (editingId ? trades.find(t => t.id === editingId)?.screenshot_url || null : null),
      new_balance: form.new_balance ? parseFloat(form.new_balance) : null,
    };

    if (editingId) {
      await supabase.from("trade_journal").update(entry).eq("id", editingId);
      toast.success("Trade updated");
    } else {
      await supabase.from("trade_journal").insert(entry);
      toast.success("Trade logged");
    }

    setForm(EMPTY_FORM);
    setScreenshot(null);
    setScreenshotPreview(null);
    setShowForm(false);
    setEditingId(null);
    setSaving(false);
    loadTrades();
  };

  const deleteTrade = async (id: string) => {
    await supabase.from("trade_journal").delete().eq("id", id);
    toast.success("Trade deleted");
    loadTrades();
  };

  const editTrade = (trade: TradeEntry) => {
    setForm({
      trade_date: trade.trade_date.slice(0, 16),
      asset: trade.asset,
      direction: trade.direction,
      entry_price: String(trade.entry_price),
      stop_loss: trade.stop_loss ? String(trade.stop_loss) : "",
      take_profit: trade.take_profit ? String(trade.take_profit) : "",
      exit_price: trade.exit_price ? String(trade.exit_price) : "",
      lot_size: trade.lot_size ? String(trade.lot_size) : "",
      risk_percent: trade.risk_percent ? String(trade.risk_percent) : "",
      outcome: trade.outcome || "open",
      profit_loss: trade.profit_loss ? String(trade.profit_loss) : "",
      strategy_used: trade.strategy_used || "",
      notes: trade.notes || "",
      new_balance: trade.new_balance ? String(trade.new_balance) : "",
    });
    setScreenshotPreview(trade.screenshot_url);
    setEditingId(trade.id);
    setShowForm(true);
  };

  const wins = trades.filter(t => t.outcome === "win").length;
  const losses = trades.filter(t => t.outcome === "loss").length;
  const winRate = trades.length > 0 ? Math.round((wins / (wins + losses || 1)) * 100) : 0;
  const totalPnL = trades.reduce((s, t) => s + (t.profit_loss || 0), 0);

  return (
    <div className="min-h-screen bg-[hsl(270,30%,6%)] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-sm font-bold tracking-wider uppercase text-purple-300">Trading Journal</h1>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm(EMPTY_FORM); setScreenshotPreview(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-xs font-medium hover:opacity-90"
        >
          <Plus className="w-3.5 h-3.5" /> New Trade
        </button>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Trades", value: trades.length, color: "text-purple-400" },
            { label: "Win Rate", value: `${winRate}%`, color: "text-emerald-400" },
            { label: "Wins / Losses", value: `${wins} / ${losses}`, color: "text-yellow-400" },
            { label: "Total P/L", value: `${totalPnL >= 0 ? "+" : ""}${totalPnL.toFixed(2)}`, color: totalPnL >= 0 ? "text-emerald-400" : "text-red-400" },
          ].map(s => (
            <div key={s.label} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-xl p-4 text-center">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-purple-400 uppercase tracking-wider mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Form modal */}
        {showForm && (
          <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-lg">{editingId ? "Edit Trade" : "Log New Trade"}</h2>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-purple-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Screenshot upload */}
            <div>
              <label className="text-xs text-purple-300 mb-1 block">Trade Screenshot</label>
              <div
                className="border-2 border-dashed border-purple-700/50 rounded-xl p-6 text-center cursor-pointer hover:border-purple-500/70 transition"
                onClick={() => fileRef.current?.click()}
              >
                {screenshotPreview ? (
                  <img src={screenshotPreview} alt="Screenshot" className="max-h-40 mx-auto rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-purple-400">
                    <Upload className="w-8 h-8" />
                    <p className="text-xs">Click or drag to upload screenshot</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>

            {/* Form grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {[
                { key: "trade_date", label: "Date/Time", type: "datetime-local" },
                { key: "asset", label: "Asset/Pair", type: "text", placeholder: "GBPJPY" },
                { key: "entry_price", label: "Entry Price", type: "number", placeholder: "1.2345" },
                { key: "stop_loss", label: "Stop Loss", type: "number", placeholder: "1.2300" },
                { key: "take_profit", label: "Take Profit", type: "number", placeholder: "1.2400" },
                { key: "exit_price", label: "Exit Price", type: "number", placeholder: "1.2390" },
                { key: "lot_size", label: "Lot Size", type: "number", placeholder: "0.1" },
                { key: "risk_percent", label: "Risk %", type: "number", placeholder: "1" },
                { key: "profit_loss", label: "Profit/Loss", type: "number", placeholder: "50.00" },
                { key: "new_balance", label: "New Balance", type: "number", placeholder: "10050" },
                { key: "strategy_used", label: "Strategy", type: "text", placeholder: "Breakout" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-[10px] text-purple-400 uppercase tracking-wider">{f.label}</label>
                  <input
                    type={f.type}
                    value={(form as any)[f.key]}
                    onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full mt-0.5 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-800/30 text-white text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}

              <div>
                <label className="text-[10px] text-purple-400 uppercase tracking-wider">Direction</label>
                <select
                  value={form.direction}
                  onChange={e => setForm(prev => ({ ...prev, direction: e.target.value as any }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-800/30 text-white text-xs"
                >
                  <option value="buy">Buy</option>
                  <option value="sell">Sell</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-purple-400 uppercase tracking-wider">Outcome</label>
                <select
                  value={form.outcome}
                  onChange={e => setForm(prev => ({ ...prev, outcome: e.target.value as any }))}
                  className="w-full mt-0.5 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-800/30 text-white text-xs"
                >
                  <option value="open">Open</option>
                  <option value="win">Win</option>
                  <option value="loss">Loss</option>
                  <option value="breakeven">Breakeven</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] text-purple-400 uppercase tracking-wider">Notes / Reflections</label>
              <textarea
                value={form.notes}
                onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                placeholder="What did you learn from this trade? What would you do differently?"
                className="w-full mt-0.5 px-3 py-2 rounded-lg bg-purple-950/50 border border-purple-800/30 text-white text-xs focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {saving ? "Saving..." : editingId ? "Update Trade" : "Log Trade"}
            </button>
          </div>
        )}

        {/* Trade log table */}
        {loading ? (
          <div className="text-center py-12 text-purple-400 text-sm">Loading trades...</div>
        ) : trades.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-purple-300/70 text-sm mb-4">No trades logged yet. Start journaling your trades!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300">Trade History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider text-purple-500 border-b border-purple-800/30">
                    <th className="text-left py-3 px-2">Date</th>
                    <th className="text-left py-3 px-2">Asset</th>
                    <th className="text-center py-3 px-2">Dir</th>
                    <th className="text-right py-3 px-2">Entry</th>
                    <th className="text-right py-3 px-2">SL</th>
                    <th className="text-right py-3 px-2">TP</th>
                    <th className="text-right py-3 px-2">Size</th>
                    <th className="text-center py-3 px-2">Result</th>
                    <th className="text-right py-3 px-2">P/L</th>
                    <th className="text-right py-3 px-2">Balance</th>
                    <th className="text-center py-3 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(trade => (
                    <tr key={trade.id} className="border-b border-purple-900/20 hover:bg-purple-900/10">
                      <td className="py-2.5 px-2 text-purple-200">{new Date(trade.trade_date).toLocaleDateString()}</td>
                      <td className="py-2.5 px-2 font-medium">{trade.asset}</td>
                      <td className="py-2.5 px-2 text-center">
                        {trade.direction === "buy" ? (
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-400 inline" />
                        ) : (
                          <TrendingDown className="w-3.5 h-3.5 text-red-400 inline" />
                        )}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono">{trade.entry_price}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-red-400/70">{trade.stop_loss || "—"}</td>
                      <td className="py-2.5 px-2 text-right font-mono text-emerald-400/70">{trade.take_profit || "—"}</td>
                      <td className="py-2.5 px-2 text-right font-mono">{trade.lot_size || "—"}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          trade.outcome === "win" ? "bg-emerald-500/20 text-emerald-400" :
                          trade.outcome === "loss" ? "bg-red-500/20 text-red-400" :
                          trade.outcome === "breakeven" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {trade.outcome || "open"}
                        </span>
                      </td>
                      <td className={`py-2.5 px-2 text-right font-mono ${(trade.profit_loss || 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {trade.profit_loss != null ? `${trade.profit_loss >= 0 ? "+" : ""}${trade.profit_loss}` : "—"}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-purple-300">{trade.new_balance || "—"}</td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => editTrade(trade)} className="p-1 text-purple-400 hover:text-white"><Edit2 className="w-3 h-3" /></button>
                          <button onClick={() => deleteTrade(trade.id)} className="p-1 text-purple-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Notes section below table */}
            {trades.some(t => t.notes) && (
              <div className="space-y-2 mt-4">
                <h3 className="text-xs text-purple-400 uppercase tracking-wider">Recent Notes</h3>
                {trades.filter(t => t.notes).slice(0, 3).map(t => (
                  <div key={t.id} className="bg-purple-950/30 rounded-lg p-3 text-xs text-purple-200">
                    <span className="text-purple-400 font-medium">{t.asset} ({new Date(t.trade_date).toLocaleDateString()}):</span> {t.notes}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
