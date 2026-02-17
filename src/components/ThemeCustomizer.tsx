import { useState } from "react";
import { Palette, Sun, Moon, X, Image } from "lucide-react";

const COLOR_THEMES = [
  { id: "navy", label: "Navy Blue", primary: "220 70% 45%", sidebar: "220 50% 16%", navy: "220 50% 20%" },
  { id: "emerald", label: "Emerald", primary: "152 60% 38%", sidebar: "152 40% 14%", navy: "152 40% 18%" },
  { id: "gold", label: "Gold Rush", primary: "42 80% 50%", sidebar: "42 40% 14%", navy: "42 40% 18%" },
  { id: "crimson", label: "Crimson", primary: "0 72% 51%", sidebar: "0 40% 14%", navy: "0 40% 18%" },
  { id: "violet", label: "Violet", primary: "270 60% 50%", sidebar: "270 40% 14%", navy: "270 40% 18%" },
  { id: "teal", label: "Teal", primary: "180 60% 38%", sidebar: "180 40% 14%", navy: "180 40% 18%" },
];

const WALLPAPERS = [
  { id: "none", label: "None", url: "" },
  { id: "candlestick-dark", label: "Candlestick Dark", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80" },
  { id: "trading-screen", label: "Trading Screen", url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1920&q=80" },
  { id: "chart-green", label: "Chart Green", url: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1920&q=80" },
  { id: "forex-data", label: "Market Data", url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&q=80" },
  { id: "stock-chart", label: "Stock Chart", url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1920&q=80" },
];

interface ThemeCustomizerProps {
  onThemeChange: (theme: typeof COLOR_THEMES[0]) => void;
  onDarkModeToggle: () => void;
  onWallpaperChange: (url: string) => void;
  isDark: boolean;
  currentTheme: string;
  currentWallpaper: string;
}

export function ThemeCustomizer({
  onThemeChange,
  onDarkModeToggle,
  onWallpaperChange,
  isDark,
  currentTheme,
  currentWallpaper,
}: ThemeCustomizerProps) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
        title="Customize theme"
      >
        <Palette className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-[380px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Customize Theme
          </h3>
          <button onClick={() => setOpen(false)} className="p-1 rounded-md hover:bg-secondary transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Dark/Light Toggle */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Mode</p>
            <button
              onClick={onDarkModeToggle}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-secondary text-xs text-foreground hover:bg-accent transition-all w-full"
            >
              {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              {isDark ? "Dark Mode" : "Light Mode"}
              <span className="ml-auto text-[10px] text-muted-foreground">Click to toggle</span>
            </button>
          </div>

          {/* Color Themes */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accent Color</p>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme)}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                    currentTheme === theme.id ? "border-primary bg-accent" : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="w-6 h-6 rounded-full" style={{ background: `hsl(${theme.primary})` }} />
                  <span className="text-[10px] text-foreground">{theme.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Wallpapers */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Image className="w-3 h-3" />
              Chart Wallpaper
            </p>
            <div className="grid grid-cols-2 gap-2">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => onWallpaperChange(wp.url)}
                  className={`relative rounded-xl border overflow-hidden h-16 transition-all ${
                    currentWallpaper === wp.url ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/50"
                  }`}
                >
                  {wp.url ? (
                    <img src={wp.url} alt={wp.label} className="w-full h-full object-cover opacity-70" />
                  ) : (
                    <div className="w-full h-full bg-background flex items-center justify-center">
                      <span className="text-[10px] text-muted-foreground">None</span>
                    </div>
                  )}
                  <span className="absolute bottom-0.5 left-1 text-[9px] text-white font-medium drop-shadow-lg">
                    {wp.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
