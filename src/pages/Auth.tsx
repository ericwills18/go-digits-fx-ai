import { useState } from "react";
import { BarChart3, Sparkles, TrendingUp, Shield, BookOpen } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin
    });
    if (error) {
      toast.error(error.message || "Failed to sign in with Google");
    }
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin }
      });
      if (error) toast.error(error.message);else
      toast.success("Check your email to confirm your account!");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
    }
    setLoading(false);
  };

  const features = [
  { icon: TrendingUp, label: "AI Chart Analysis", desc: "Upload charts for instant signals" },
  { icon: Shield, label: "Risk Management", desc: "Professional position sizing tools" },
  { icon: BookOpen, label: "18 Strategies", desc: "Complete GO-DIGITS curriculum" }];


  return (
    <div className="min-h-screen bg-background aurora-bg flex">
      {/* Left - Branding */}
      <div className="hidden lg:flex flex-1 flex-col justify-center items-center p-12 relative z-10">
        <div className="max-w-md">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">GO-DIGITS</h1>
              <p className="text-xs text-muted-foreground">Forex AI Assistant</p>
            </div>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4 leading-tight">
            Your AI-powered forex trading companion
          </h2>
          <p className="text-muted-foreground mb-8">
            Get professional chart analysis, trading signals, and risk management guidance — all powered by AI.
          </p>
          <div className="space-y-4">
            {features.map((f) =>
            <div key={f.label} className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{f.label}</p>
                  <p className="text-xs text-muted-foreground">{f.desc}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right - Auth form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">GO-DIGITS FOREX ACADEMY</span>
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

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-border bg-secondary/50 text-sm text-foreground hover:bg-secondary transition-colors disabled:opacity-50 mb-4">

              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] text-muted-foreground uppercase">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Email form */}
            <form onSubmit={handleEmailAuth} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2.5 rounded-xl bg-input border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">

                {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
              </button>
            </form>

            <p className="text-xs text-center text-muted-foreground mt-4">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-primary hover:underline">

                {isSignUp ? "Sign in" : "Sign up"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>);

}
