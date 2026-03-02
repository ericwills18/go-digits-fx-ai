import { useState } from "react";
import { Sparkles, TrendingUp, Shield, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import aiAvatar from "@/assets/ai-avatar.jpeg";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) toast.error(error.message);
      else toast.success("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  const features = [
    { icon: TrendingUp, label: "AI Chart Analysis", desc: "Upload charts for instant signals" },
    { icon: Shield, label: "Risk Management", desc: "Professional position sizing tools" },
    { icon: BookOpen, label: "20 Strategies", desc: "Complete Asphalt FX curriculum" },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative z-10 bg-[hsl(var(--navy))]">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-primary/30 ai-avatar-glow">
             <img src={aiAvatar} alt="Asphalt FX AI" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Asphalt FX</h1>
              <p className="text-xs text-white/60">Forex AI Academy</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-tight">
            Your AI-powered forex trading companion
          </h2>
          <p className="text-white/70 mb-8">
            Get professional chart analysis, trading signals, and risk management guidance — all powered by AI.
          </p>
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.label} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-white/5 border border-white/10">
                <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{f.label}</p>
                  <p className="text-xs text-white/50">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-white/40 mt-8">Founded by Williams Eric</p>
        </div>
      </div>

      {/* Right - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-primary/30 ai-avatar-glow mb-3">
              <img src={aiAvatar} alt="Asphalt FX AI" className="w-full h-full object-cover" />
            </div>
            <span className="text-xl font-bold text-foreground">Asphalt FX</span>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <div className="text-center mb-6">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">
                {isSignUp ? "Create your account" : "Welcome back trader"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {isSignUp ? "Start your trading journey" : "Sign in to continue"}
              </p>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary/50"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline">
                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>

          <p className="text-[10px] text-center text-muted-foreground mt-4">
            Founded by Williams Eric
          </p>
        </div>
      </div>
    </div>
  );
}
