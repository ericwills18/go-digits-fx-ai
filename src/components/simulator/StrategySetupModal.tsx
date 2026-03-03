import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { SimStrategy } from "./types";
import { SIM_STRATEGIES } from "./strategies";
import { Shield, Sparkles, ChevronRight } from "lucide-react";

interface Props {
  open: boolean;
  onComplete: (config: {
    strategy: SimStrategy;
    coachMode: "guided" | "silent";
    riskPerTrade: number;
    maxTrades: number;
    balance: number;
  }) => void;
}

export function StrategySetupModal({ open, onComplete }: Props) {
  const [step, setStep] = useState<"strategy" | "rules">("strategy");
  const [selected, setSelected] = useState<SimStrategy | null>(null);
  const [coachOn, setCoachOn] = useState(true);
  const [riskPercent, setRiskPercent] = useState(1);
  const [maxTrades, setMaxTrades] = useState(10);
  const [balance, setBalance] = useState(5000);

  const handleSelect = (s: SimStrategy) => {
    setSelected(s);
    if (s.id === "free-practice") {
      onComplete({
        strategy: s,
        coachMode: "silent",
        riskPerTrade: riskPercent,
        maxTrades: 0,
        balance,
      });
      return;
    }
    setStep("rules");
  };

  const handleStart = () => {
    if (!selected) return;
    onComplete({
      strategy: selected,
      coachMode: coachOn ? "guided" : "silent",
      riskPerTrade: riskPercent,
      maxTrades,
      balance,
    });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-card border-border [&>button]:hidden">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            {step === "strategy" ? "Choose Your Strategy" : "Set Rules"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {step === "strategy"
              ? "Select a strategy to practice, or choose Free Practice to trade without constraints."
              : `Configure rules for ${selected?.name}`}
          </DialogDescription>
        </DialogHeader>

        {step === "strategy" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {SIM_STRATEGIES.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className={`text-left p-4 rounded-xl border transition-all hover:border-primary/50 hover:bg-accent/50 ${
                  selected?.id === s.id ? "border-primary bg-accent" : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{s.icon}</span>
                  <h3 className="font-semibold text-sm text-foreground">{s.name}</h3>
                </div>
                <p className="text-[11px] text-muted-foreground mb-2">{s.description}</p>
                <div className="space-y-1">
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-muted-foreground">TF:</span>
                    <span className="text-foreground">{s.timeframe}</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-muted-foreground">Entry:</span>
                    <span className="text-foreground truncate">{s.entryTrigger}</span>
                  </div>
                  <div className="flex gap-2 text-[10px]">
                    <span className="text-muted-foreground">R:R:</span>
                    <span className="text-foreground">{s.riskRule}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-6 mt-2">
            {/* Balance */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">Starting Balance (₦)</label>
              <div className="flex gap-2">
                {[1000, 5000, 10000, 50000].map((b) => (
                  <button
                    key={b}
                    onClick={() => setBalance(b)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      balance === b ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    ₦{b.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk per trade */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                Risk per trade: <span className="text-primary">{riskPercent}%</span> (₦{((balance * riskPercent) / 100).toFixed(0)})
              </label>
              <Slider
                value={[riskPercent]}
                onValueChange={([v]) => setRiskPercent(v)}
                min={0.5}
                max={5}
                step={0.5}
                className="w-full"
              />
            </div>

            {/* Max trades */}
            <div>
              <label className="text-xs font-medium text-foreground mb-2 block">
                Max trades per session: <span className="text-primary">{maxTrades}</span>
              </label>
              <Slider
                value={[maxTrades]}
                onValueChange={([v]) => setMaxTrades(v)}
                min={1}
                max={20}
                step={1}
                className="w-full"
              />
            </div>

            {/* Coach mode */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-secondary/30">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <div>
                  <p className="text-xs font-medium text-foreground">AI Coach Mode</p>
                  <p className="text-[10px] text-muted-foreground">
                    {coachOn ? "Guided — AI enforces strategy rules" : "Silent — AI observes only"}
                  </p>
                </div>
              </div>
              <Switch checked={coachOn} onCheckedChange={setCoachOn} />
            </div>

            {/* Strategy checklist preview */}
            {selected && selected.checklist.length > 0 && (
              <div className="p-3 rounded-xl border border-border bg-secondary/20">
                <p className="text-xs font-medium text-foreground mb-2">Required Confirmations:</p>
                <div className="space-y-1">
                  {selected.checklist.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("strategy")} className="flex-1">
                Back
              </Button>
              <Button onClick={handleStart} className="flex-1 gap-2">
                Start Simulation <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        <p className="text-[9px] text-muted-foreground text-center mt-2">
          ⚠️ Practice simulator. Educational coaching only. Not financial advice.
        </p>
      </DialogContent>
    </Dialog>
  );
}
