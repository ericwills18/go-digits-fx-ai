
-- User course progress tracking
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  course_icon TEXT NOT NULL DEFAULT '📚',
  level TEXT NOT NULL DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Professional')),
  overall_progress INTEGER NOT NULL DEFAULT 0,
  xp INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- User module progress tracking
CREATE TABLE public.user_module_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_name TEXT NOT NULL,
  focus_area TEXT NOT NULL DEFAULT '',
  level TEXT NOT NULL DEFAULT 'Beginner',
  status TEXT NOT NULL DEFAULT 'locked' CHECK (status IN ('complete', 'in_progress', 'locked')),
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id, module_name)
);

-- Trading journal
CREATE TABLE public.trade_journal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  trade_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  asset TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('buy', 'sell')),
  entry_price NUMERIC NOT NULL,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  exit_price NUMERIC,
  lot_size NUMERIC,
  risk_percent NUMERIC,
  outcome TEXT CHECK (outcome IN ('win', 'loss', 'breakeven', 'open')),
  profit_loss NUMERIC,
  strategy_used TEXT,
  notes TEXT,
  screenshot_url TEXT,
  close_date TIMESTAMP WITH TIME ZONE,
  new_balance NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own course progress" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own course progress" ON public.user_course_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own course progress" ON public.user_course_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own module progress" ON public.user_module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own module progress" ON public.user_module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own module progress" ON public.user_module_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own journal" ON public.trade_journal FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert journal entries" ON public.trade_journal FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal entries" ON public.trade_journal FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal entries" ON public.trade_journal FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for journal screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('journal-screenshots', 'journal-screenshots', true) ON CONFLICT DO NOTHING;

CREATE POLICY "Users can upload journal screenshots" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'journal-screenshots' AND auth.uid() IS NOT NULL);
CREATE POLICY "Anyone can view journal screenshots" ON storage.objects FOR SELECT USING (bucket_id = 'journal-screenshots');
