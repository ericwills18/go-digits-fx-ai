import { Play, Pause, SkipBack, ChevronLeft } from "lucide-react";
import { AVAILABLE_ASSETS, TIMEFRAMES } from "./sampleData";
import { useNavigate } from "react-router-dom";

interface Props {
  asset: string;
  timeframe: string;
  speed: number;
  isPlaying: boolean;
  balance: number;
  equity: number;
  currentPrice: number;
  onAssetChange: (a: string) => void;
  onTimeframeChange: (tf: string) => void;
  onSpeedChange: (s: number) => void;
  onPlayPause: () => void;
  onRewind: () => void;
}

const SPEEDS = [1, 2, 5, 10];

export function TopBar({
  asset,
  timeframe,
  speed,
  isPlaying,
  balance,
  equity,
  currentPrice,
  onAssetChange,
  onTimeframeChange,
  onSpeedChange,
  onPlayPause,
  onRewind,
}: Props) {
  const navigate = useNavigate();
  const pnl = equity - balance;
  const decimals = currentPrice > 100 ? 2 : 5;

  return (
    <header className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border text-xs">
      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title="Back to chat"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-border" />

      {/* Asset selector */}
      <select
        value={asset}
        onChange={(e) => onAssetChange(e.target.value)}
        className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs font-bold text-foreground"
      >
        {AVAILABLE_ASSETS.map((a) => (
          <option key={a} value={a}>{a}</option>
        ))}
      </select>

      {/* Price */}
      <span className="font-mono font-bold text-foreground text-sm">{currentPrice.toFixed(decimals)}</span>

      <div className="w-px h-5 bg-border" />

      {/* Timeframe */}
      <div className="flex gap-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => onTimeframeChange(tf.label)}
            className={`px-2 py-1 rounded text-[10px] font-medium transition-all ${
              timeframe === tf.label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border" />

      {/* Playback controls */}
      <button
        onClick={onRewind}
        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
        title="Rewind"
      >
        <SkipBack className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onPlayPause}
        className={`p-1.5 rounded-lg transition-all ${
          isPlaying ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
        }`}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      </button>

      {/* Speed */}
      <div className="flex gap-0.5">
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => onSpeedChange(s)}
            className={`px-1.5 py-1 rounded text-[10px] font-medium transition-all ${
              speed === s ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-secondary"
            }`}
          >
            {s}x
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Balance/Equity */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Balance</p>
          <p className="font-mono font-bold text-foreground">₦{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">Equity</p>
          <p className="font-mono font-bold text-foreground">₦{equity.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-muted-foreground">P&L</p>
          <p className={`font-mono font-bold ${pnl >= 0 ? "text-bull" : "text-bear"}`}>
            {pnl >= 0 ? "+" : ""}₦{pnl.toFixed(2)}
          </p>
        </div>
      </div>
    </header>
  );
}
