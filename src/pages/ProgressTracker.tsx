import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Trophy, Lock, CheckCircle2, RotateCcw, Flame, Star, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import aiAvatar from "@/assets/ai-avatar.jpeg";

type ModuleStatus = "complete" | "in_progress" | "locked";
type Level = "Beginner" | "Intermediate" | "Professional";

interface Module {
  name: string;
  focus: string;
  status: ModuleStatus;
  progress: number;
}

interface CourseProgress {
  id: string;
  name: string;
  icon: string;
  level: Level;
  modules: Module[];
  overallProgress: number;
  streak: number;
  xp: number;
}

// Demo data — in production this would come from the database
const DEMO_COURSES: CourseProgress[] = [
  {
    id: "about-forex",
    name: "About Forex / What is Forex?",
    icon: "🌍",
    level: "Beginner",
    modules: [
      { name: "Introduction to Forex", focus: "What is Forex & why it matters", status: "complete", progress: 100 },
      { name: "Market Participants", focus: "Who trades Forex", status: "complete", progress: 100 },
      { name: "Currency Pairs Basics", focus: "How pairs work", status: "in_progress", progress: 60 },
      { name: "Trading Sessions", focus: "Sydney, Tokyo, London, NY", status: "locked", progress: 0 },
      { name: "Forex vs Other Markets", focus: "Comparison & advantages", status: "locked", progress: 0 },
    ],
    overallProgress: 52,
    streak: 6,
    xp: 1250,
  },
  {
    id: "candlestick-basics",
    name: "Candlestick Basics & Candle Range Theory",
    icon: "🕯️",
    level: "Beginner",
    modules: [
      { name: "Candle Anatomy", focus: "Open, High, Low, Close", status: "complete", progress: 100 },
      { name: "Body-to-Wick Ratio", focus: "Reading candle strength", status: "in_progress", progress: 30 },
      { name: "Key Patterns", focus: "Doji, Hammer, Engulfing", status: "locked", progress: 0 },
      { name: "Range Theory", focus: "Expansion & contraction", status: "locked", progress: 0 },
    ],
    overallProgress: 32,
    streak: 3,
    xp: 680,
  },
  {
    id: "smart-money",
    name: "Smart Money Concepts (Full Model)",
    icon: "🧠",
    level: "Intermediate",
    modules: [
      { name: "Premium & Discount Zones", focus: "Fair value pricing", status: "locked", progress: 0 },
      { name: "Inducement", focus: "Liquidity traps", status: "locked", progress: 0 },
      { name: "PD Arrays", focus: "Order blocks, FVGs, breakers", status: "locked", progress: 0 },
    ],
    overallProgress: 0,
    streak: 0,
    xp: 0,
  },
];

const LEVEL_COLORS: Record<Level, string> = {
  Beginner: "from-emerald-500 to-emerald-700",
  Intermediate: "from-amber-500 to-amber-700",
  Professional: "from-purple-500 to-red-500",
};

const LEVEL_BADGES: Record<Level, string> = {
  Beginner: "🟢",
  Intermediate: "🟡",
  Professional: "🔴",
};

function StatusIcon({ status }: { status: ModuleStatus }) {
  if (status === "complete") return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
  if (status === "in_progress") return <RotateCcw className="w-4 h-4 text-purple-400 animate-spin" style={{ animationDuration: "3s" }} />;
  return <Lock className="w-3.5 h-3.5 text-muted-foreground/40" />;
}

export default function ProgressTracker() {
  const navigate = useNavigate();
  const [courses] = useState<CourseProgress[]>(DEMO_COURSES);

  const totalXP = courses.reduce((s, c) => s + c.xp, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.modules.filter(m => m.status === "complete").length, 0);
  const totalModules = courses.reduce((s, c) => s + c.modules.length, 0);
  const overallPercent = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
  const maxStreak = Math.max(...courses.map(c => c.streak), 0);
  const enrolledCount = courses.length;

  return (
    <div className="min-h-screen bg-[hsl(270,30%,6%)] text-white">
      {/* Top nav */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Learning</span>
        </button>
        <h1 className="text-sm font-bold tracking-wider uppercase text-purple-300">Progress Tracker</h1>
        <div className="w-20" />
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero profile card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile */}
          <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6 space-y-4">
            <h2 className="text-xl font-bold tracking-tight">SOLO LEVELING<br /><span className="text-purple-400 text-base font-normal">System</span></h2>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-[0_0_20px_hsla(270,80%,60%,0.3)]">
                <img src={aiAvatar} alt="Profile" className="w-full h-full object-cover" />
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-purple-400" /> <span className="text-purple-300">Rank:</span> <span className="font-semibold">Student</span></div>
                <div className="flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-orange-400" /> <span className="text-purple-300">Streak:</span> <span className="font-semibold">{maxStreak} days</span></div>
                <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-purple-400" /> <span className="text-purple-300">Enrolled:</span> <span className="font-semibold">{enrolledCount} courses</span></div>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-purple-300"><span>Experience</span><span>{totalXP} XP</span></div>
              <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all" style={{ width: `${Math.min(overallPercent * 1.5, 100)}%` }} />
              </div>
            </div>
          </div>

          {/* Stats grid */}
          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "text-yellow-400" },
              { label: "Modules Done", value: `${totalCompleted}/${totalModules}`, icon: CheckCircle2, color: "text-emerald-400" },
              { label: "Overall", value: `${overallPercent}%`, icon: Trophy, color: "text-purple-400" },
              { label: "Day Streak", value: maxStreak.toString(), icon: Flame, color: "text-orange-400" },
            ].map((stat) => (
              <div key={stat.label} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[11px] text-purple-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Completion ring */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6 flex items-center gap-6">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(270,20%,18%)" strokeWidth="10" />
                <circle
                  cx="60" cy="60" r="50" fill="none"
                  stroke="url(#purpleGrad)" strokeWidth="10"
                  strokeLinecap="round"
                  strokeDasharray={`${overallPercent * 3.14} 314`}
                />
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="hsl(270,80%,60%)" />
                    <stop offset="100%" stopColor="hsl(320,80%,60%)" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-purple-400 font-bold">XP</span>
                <span className="text-xl font-bold">{overallPercent}%</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">Goal Completion</h3>
              <p className="text-sm text-purple-300/70">Complete all enrolled courses to reach mastery rank. Keep your daily streak going!</p>
            </div>
          </div>

          {/* Skill Tracker */}
          <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6">
            <h3 className="font-bold text-lg mb-4">SKILL TRACKER</h3>
            <div className="space-y-3">
              {courses.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <span className="text-lg">{c.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs text-purple-200 truncate">{c.name}</p>
                    <div className="h-1.5 rounded-full bg-purple-950 mt-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all"
                        style={{ width: `${c.overallProgress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-purple-400 font-mono w-10 text-right">{c.overallProgress}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Course cards */}
        <div className="space-y-6">
          <h2 className="text-lg font-bold uppercase tracking-wider text-purple-300">Enrolled Courses</h2>
          {courses.map((course) => (
            <div key={course.id} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl overflow-hidden">
              {/* Course header */}
              <div className="px-6 py-4 flex items-center justify-between border-b border-purple-800/20">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{course.icon}</span>
                  <div>
                    <h3 className="font-bold text-sm">{course.name}</h3>
                    <p className="text-xs text-purple-400">{LEVEL_BADGES[course.level]} {course.level} Level • {course.xp} XP earned</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-xl font-bold text-purple-300">{course.overallProgress}%</p>
                    <p className="text-[10px] text-purple-500 uppercase">Complete</p>
                  </div>
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${LEVEL_COLORS[course.level]} flex items-center justify-center`}>
                    <Trophy className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Modules table */}
              <div className="px-6 py-3">
                <table className="w-full">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-purple-500">
                      <th className="text-left py-2 font-medium">Module</th>
                      <th className="text-left py-2 font-medium">Focus Area</th>
                      <th className="text-center py-2 font-medium">Status</th>
                      <th className="text-right py-2 font-medium">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {course.modules.map((mod, i) => (
                      <tr key={i} className={`border-t border-purple-900/20 ${mod.status === "locked" ? "opacity-40" : ""}`}>
                        <td className="py-2.5 text-xs font-medium">{mod.name}</td>
                        <td className="py-2.5 text-xs text-purple-300/70">{mod.focus}</td>
                        <td className="py-2.5 text-center"><StatusIcon status={mod.status} /></td>
                        <td className="py-2.5">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 h-1.5 rounded-full bg-purple-950 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  mod.status === "complete" ? "bg-emerald-500" :
                                  mod.status === "in_progress" ? "bg-purple-500" : "bg-transparent"
                                }`}
                                style={{ width: `${mod.progress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono text-purple-400 w-8 text-right">{mod.progress}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
