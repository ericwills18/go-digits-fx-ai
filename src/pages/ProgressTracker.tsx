import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Trophy, Lock, CheckCircle2, RotateCcw, Flame, Star, Zap, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import aiAvatar from "@/assets/ai-avatar.jpeg";

type ModuleStatus = "complete" | "in_progress" | "locked";
type Level = "Beginner" | "Intermediate" | "Professional";

interface ModuleProgress {
  module_name: string;
  focus_area: string;
  status: ModuleStatus;
  progress: number;
  level: string;
}

interface CourseProgress {
  course_id: string;
  course_name: string;
  course_icon: string;
  level: Level;
  overall_progress: number;
  xp: number;
  streak: number;
  enrolled_at: string;
  last_activity_at: string;
  completed_at: string | null;
  modules: ModuleProgress[];
}

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

function EmptyState() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4">
      <div className="w-20 h-20 rounded-2xl bg-purple-900/30 flex items-center justify-center mb-6">
        <BookOpen className="w-10 h-10 text-purple-400" />
      </div>
      <h2 className="text-xl font-bold mb-2">No Courses Yet</h2>
      <p className="text-purple-300/70 text-sm text-center max-w-md mb-6">
        Start learning by selecting a course from the main page. Your progress will automatically appear here.
      </p>
      <button
        onClick={() => navigate("/")}
        className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-fuchsia-500 text-white text-sm font-medium hover:opacity-90 transition"
      >
        Browse Courses
      </button>
    </div>
  );
}

export default function ProgressTracker() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadProgress();
  }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    setLoading(true);

    const { data: courseData } = await supabase
      .from("user_course_progress")
      .select("*")
      .eq("user_id", user.id)
      .order("last_activity_at", { ascending: false });

    if (!courseData || courseData.length === 0) {
      setCourses([]);
      setLoading(false);
      return;
    }

    const courseIds = courseData.map((c: any) => c.course_id);
    const { data: moduleData } = await supabase
      .from("user_module_progress")
      .select("*")
      .eq("user_id", user.id)
      .in("course_id", courseIds);

    const coursesWithModules: CourseProgress[] = courseData.map((c: any) => ({
      course_id: c.course_id,
      course_name: c.course_name,
      course_icon: c.course_icon,
      level: c.level as Level,
      overall_progress: c.overall_progress,
      xp: c.xp,
      streak: c.streak,
      enrolled_at: c.enrolled_at,
      last_activity_at: c.last_activity_at,
      completed_at: c.completed_at,
      modules: (moduleData || [])
        .filter((m: any) => m.course_id === c.course_id)
        .map((m: any) => ({
          module_name: m.module_name,
          focus_area: m.focus_area,
          status: m.status as ModuleStatus,
          progress: m.progress,
          level: m.level,
        })),
    }));

    setCourses(coursesWithModules);
    setLoading(false);
  };

  const totalXP = courses.reduce((s, c) => s + c.xp, 0);
  const totalCompleted = courses.reduce((s, c) => s + c.modules.filter(m => m.status === "complete").length, 0);
  const totalModules = courses.reduce((s, c) => s + c.modules.length, 0);
  const overallPercent = totalModules > 0 ? Math.round((totalCompleted / totalModules) * 100) : 0;
  const maxStreak = courses.length > 0 ? Math.max(...courses.map(c => c.streak), 0) : 0;
  const activeCourses = courses.filter(c => !c.completed_at).length;
  const completedCourses = courses.filter(c => c.completed_at).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[hsl(270,30%,6%)] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-purple-300">Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(270,30%,6%)] text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-purple-900/40">
        <button onClick={() => navigate("/")} className="flex items-center gap-2 text-purple-300 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Learning</span>
        </button>
        <h1 className="text-sm font-bold tracking-wider uppercase text-purple-300">Progress Tracker</h1>
        <div className="w-20" />
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {courses.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Profile + Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6 space-y-4">
                <h2 className="text-xl font-bold tracking-tight">SOLO LEVELING<br /><span className="text-purple-400 text-base font-normal">System</span></h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-purple-500/50 shadow-[0_0_20px_hsla(270,80%,60%,0.3)]">
                    <img src={aiAvatar} alt="Profile" className="w-full h-full object-cover" />
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-purple-400" /> <span className="text-purple-300">Rank:</span> <span className="font-semibold">{totalXP > 5000 ? "Master" : totalXP > 2000 ? "Intermediate" : "Student"}</span></div>
                    <div className="flex items-center gap-2"><Flame className="w-3.5 h-3.5 text-orange-400" /> <span className="text-purple-300">Streak:</span> <span className="font-semibold">{maxStreak} days</span></div>
                    <div className="flex items-center gap-2"><BookOpen className="w-3.5 h-3.5 text-purple-400" /> <span className="text-purple-300">Enrolled:</span> <span className="font-semibold">{courses.length} courses</span></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-purple-300"><span>Experience</span><span>{totalXP} XP</span></div>
                  <div className="h-2.5 rounded-full bg-purple-950 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-500 transition-all" style={{ width: `${Math.min(overallPercent * 1.5, 100)}%` }} />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total XP", value: totalXP.toLocaleString(), icon: Zap, color: "text-yellow-400" },
                  { label: "Modules Done", value: `${totalCompleted}/${totalModules}`, icon: CheckCircle2, color: "text-emerald-400" },
                  { label: "Active", value: activeCourses.toString(), icon: TrendingUp, color: "text-purple-400" },
                  { label: "Completed", value: completedCourses.toString(), icon: Trophy, color: "text-orange-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-[11px] text-purple-400 uppercase tracking-wider">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Goal ring + skill tracker */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6 flex items-center gap-6">
                <div className="relative w-28 h-28 flex-shrink-0">
                  <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="hsl(270,20%,18%)" strokeWidth="10" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke="url(#purpleGrad)" strokeWidth="10" strokeLinecap="round" strokeDasharray={`${overallPercent * 3.14} 314`} />
                    <defs>
                      <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(270,80%,60%)" />
                        <stop offset="100%" stopColor="hsl(320,80%,60%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs text-purple-400 font-bold">GOAL</span>
                    <span className="text-xl font-bold">{overallPercent}%</span>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">Overall Completion</h3>
                  <p className="text-sm text-purple-300/70">Complete all enrolled courses to reach mastery rank. Keep learning every day!</p>
                </div>
              </div>

              <div className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl p-6">
                <h3 className="font-bold text-lg mb-4">SKILL TRACKER</h3>
                <div className="space-y-3">
                  {courses.map((c) => (
                    <div key={c.course_id} className="flex items-center gap-3">
                      <span className="text-lg">{c.course_icon}</span>
                      <div className="flex-1">
                        <p className="text-xs text-purple-200 truncate">{c.course_name}</p>
                        <div className="h-1.5 rounded-full bg-purple-950 mt-1 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all" style={{ width: `${c.overall_progress}%` }} />
                        </div>
                      </div>
                      <span className="text-xs text-purple-400 font-mono w-10 text-right">{c.overall_progress}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Course cards */}
            <div className="space-y-6">
              <h2 className="text-lg font-bold uppercase tracking-wider text-purple-300">Enrolled Courses</h2>
              {courses.map((course) => (
                <div key={course.course_id} className="bg-[hsl(270,25%,10%)] border border-purple-800/30 rounded-2xl overflow-hidden">
                  <div className="px-6 py-4 flex items-center justify-between border-b border-purple-800/20">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{course.course_icon}</span>
                      <div>
                        <h3 className="font-bold text-sm">{course.course_name}</h3>
                        <p className="text-xs text-purple-400">{LEVEL_BADGES[course.level]} {course.level} Level • {course.xp} XP earned</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xl font-bold text-purple-300">{course.overall_progress}%</p>
                        <p className="text-[10px] text-purple-500 uppercase">{course.completed_at ? "Completed" : "In Progress"}</p>
                      </div>
                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${LEVEL_COLORS[course.level]} flex items-center justify-center`}>
                        <Trophy className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  </div>

                  {course.modules.length > 0 && (
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
                              <td className="py-2.5 text-xs font-medium">{mod.module_name}</td>
                              <td className="py-2.5 text-xs text-purple-300/70">{mod.focus_area}</td>
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
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
