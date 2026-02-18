import { useState } from "react";
import { Palette, Sun, Moon, X, Image, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLOR_THEMES = [
  { id: "navy", label: "Navy", primary: "220 70% 45%", sidebar: "220 50% 16%", navy: "220 50% 20%", color: "#2563eb" },
  { id: "emerald", label: "Emerald", primary: "152 60% 38%", sidebar: "152 40% 14%", navy: "152 40% 18%", color: "#10b981" },
  { id: "gold", label: "Gold", primary: "42 80% 50%", sidebar: "42 40% 14%", navy: "42 40% 18%", color: "#eab308" },
  { id: "crimson", label: "Crimson", primary: "0 72% 51%", sidebar: "0 40% 14%", navy: "0 40% 18%", color: "#ef4444" },
  { id: "violet", label: "Violet", primary: "270 60% 50%", sidebar: "270 40% 14%", navy: "270 40% 18%", color: "#8b5cf6" },
  { id: "teal", label: "Teal", primary: "180 60% 38%", sidebar: "180 40% 14%", navy: "180 40% 18%", color: "#14b8a6" },
  { id: "orange", label: "Orange", primary: "25 90% 50%", sidebar: "25 40% 14%", navy: "25 40% 18%", color: "#f97316" },
  { id: "cyan", label: "Cyan", primary: "195 80% 45%", sidebar: "195 40% 14%", navy: "195 40% 18%", color: "#06b6d4" },
];

const WALLPAPERS = [
  { id: "none", label: "No Wallpaper", url: "", thumb: "" },
  { id: "candlesticks", label: "Candlesticks", url: "/wallpapers/forex-candlesticks.jpeg", thumb: "/wallpapers/forex-candlesticks.jpeg" },
  { id: "trading-desk", label: "Trading Desk", url: "/wallpapers/trading-desk.jpeg", thumb: "/wallpapers/trading-desk.jpeg" },
  { id: "forex-analysis", label: "Forex Analysis", url: "/wallpapers/forex-analysis.jpeg", thumb: "/wallpapers/forex-analysis.jpeg" },
  { id: "candlestick-dark", label: "Dark Candles", url: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&q=60" },
  { id: "trading-screen", label: "Trading Screen", url: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&q=60" },
  { id: "chart-green", label: "Green Charts", url: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=400&q=60" },
  { id: "forex-data", label: "Market Data", url: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=400&q=60" },
  { id: "stock-chart", label: "Stock Chart", url: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&q=60" },
  { id: "bull-bear", label: "Bull & Bear", url: "https://images.unsplash.com/photo-1468254095679-bbcba94a7066?w=1920&q=80", thumb: "https://images.unsplash.com/photo-1468254095679-bbcba94a7066?w=400&q=60" },
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
          title="Customize theme"
        >
          <Palette className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[340px] p-0 bg-card border-border shadow-2xl rounded-xl" sideOffset={8}>
        <Tabs defaultValue="colors" className="w-full">
          <div className="px-3 pt-3 pb-1">
            <TabsList className="w-full grid grid-cols-3 h-8">
              <TabsTrigger value="colors" className="text-[11px] gap-1">
                <Palette className="w-3 h-3" /> Colors
              </TabsTrigger>
              <TabsTrigger value="wallpaper" className="text-[11px] gap-1">
                <Image className="w-3 h-3" /> Wallpaper
              </TabsTrigger>
              <TabsTrigger value="mode" className="text-[11px] gap-1">
                {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />} Mode
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Colors Tab */}
          <TabsContent value="colors" className="p-3 pt-2 m-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Accent Color</p>
            <div className="grid grid-cols-4 gap-2">
              {COLOR_THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => onThemeChange(theme)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                    currentTheme === theme.id ? "border-primary bg-accent ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="relative w-7 h-7 rounded-full shadow-sm" style={{ background: theme.color }}>
                    {currentTheme === theme.id && (
                      <Check className="absolute inset-0 m-auto w-3.5 h-3.5 text-white drop-shadow" />
                    )}
                  </div>
                  <span className="text-[9px] text-foreground font-medium">{theme.label}</span>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Wallpaper Tab */}
          <TabsContent value="wallpaper" className="p-3 pt-2 m-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Chart Wallpaper</p>
            <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
              {WALLPAPERS.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => onWallpaperChange(wp.url)}
                  className={`relative rounded-lg border overflow-hidden h-[70px] transition-all group ${
                    currentWallpaper === wp.url ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                  }`}
                >
                  {wp.thumb ? (
                    <img src={wp.thumb} alt={wp.label} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {currentWallpaper === wp.url && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="w-5 h-5 text-white drop-shadow-lg" />
                    </div>
                  )}
                  <span className="absolute bottom-0 inset-x-0 bg-black/50 text-[9px] text-white text-center py-0.5 font-medium">
                    {wp.label}
                  </span>
                </button>
              ))}
            </div>
          </TabsContent>

          {/* Mode Tab */}
          <TabsContent value="mode" className="p-3 pt-2 m-0">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Appearance</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { if (isDark) onDarkModeToggle(); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                  !isDark ? "border-primary bg-accent ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                }`}
              >
                <Sun className="w-6 h-6 text-amber-500" />
                <span className="text-xs font-medium text-foreground">Light</span>
              </button>
              <button
                onClick={() => { if (!isDark) onDarkModeToggle(); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border transition-all ${
                  isDark ? "border-primary bg-accent ring-1 ring-primary/30" : "border-border hover:border-primary/40"
                }`}
              >
                <Moon className="w-6 h-6 text-blue-400" />
                <span className="text-xs font-medium text-foreground">Dark</span>
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
