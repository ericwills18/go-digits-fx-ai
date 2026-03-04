-- Strategies table for chart analysis
CREATE TABLE public.strategies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  checklist_steps text[] NOT NULL DEFAULT '{}',
  risk_rules text[] NOT NULL DEFAULT '{}',
  screenshot_requirements text[] NOT NULL DEFAULT '{}',
  ai_prompt_template text,
  timeframe text,
  assets text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read strategies
CREATE POLICY "Authenticated users can view strategies"
  ON public.strategies FOR SELECT TO authenticated
  USING (true);

-- Storage bucket for chart screenshots
INSERT INTO storage.buckets (id, name, public) VALUES ('chart-screenshots', 'chart-screenshots', true);

-- Allow authenticated users to upload screenshots
CREATE POLICY "Authenticated users can upload screenshots"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chart-screenshots');

-- Allow anyone to read screenshots (public bucket)
CREATE POLICY "Anyone can view chart screenshots"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'chart-screenshots');

-- Seed strategies
INSERT INTO public.strategies (name, description, checklist_steps, risk_rules, screenshot_requirements, timeframe, assets) VALUES
('Breakout', 'Trade breakouts from consolidation zones with momentum confirmation.', ARRAY['Identify consolidation range', 'Mark breakout level clearly', 'Wait for candle close beyond level', 'Confirm with volume or momentum', 'Place SL below/above range'], ARRAY['Risk 1% per trade', 'Minimum R:R 1:2', 'Max 2 trades per session', 'No entry without candle close confirmation'], ARRAY['Show the consolidation range clearly', 'Mark the breakout level', 'Include price scale and timeframe', 'Show volume if available'], 'M15 / H1', 'All major pairs'),
('Pullback / Retracement', 'Enter on pullbacks within an established trend using Fibonacci confluence.', ARRAY['Confirm trend direction (HH/HL or LH/LL)', 'Wait for pullback to key level', 'Mark Fibonacci retracement', 'Look for rejection candle at level', 'Set SL beyond pullback extreme'], ARRAY['Risk 1% per trade', 'Minimum R:R 1:1.5', 'Only trade in direction of HTF trend'], ARRAY['Show trend structure clearly', 'Mark Fibonacci levels', 'Include entry/SL/TP lines', 'Show timeframe and symbol'], 'M15 / H1', 'Trending pairs (GBPUSD, EURUSD)'),
('Support & Resistance Bounce', 'Trade bounces off proven support and resistance zones with confirmation.', ARRAY['Identify key S/R zones (min 2 touches)', 'Wait for price to reach zone', 'Look for rejection wick/pin bar', 'Confirm with RSI divergence (optional)', 'Place SL beyond the zone'], ARRAY['Risk 1% per trade', 'Minimum R:R 1:1.5', 'Do not trade mid-range'], ARRAY['Show S/R zone with at least 2 historical touches', 'Mark rejection candle', 'Include price labels for entry/SL/TP', 'Show full zone, not just a line'], 'H1 / H4', 'All pairs'),
('Liquidity Sweep', 'Trade reversals after smart money sweeps liquidity from retail stop losses.', ARRAY['Identify equal highs/lows (liquidity pool)', 'Wait for sweep beyond the level', 'Confirm with strong displacement candle', 'Identify FVG or OB for entry refinement', 'Set SL above/below sweep wick'], ARRAY['Risk 0.5-1% per trade', 'Minimum R:R 1:2', 'Confirm with displacement before entry'], ARRAY['Show the equal highs/lows clearly', 'Mark the sweep wick', 'Show displacement candle', 'Include lower timeframe confirmation if used'], 'M5 / M15', 'EURUSD, GBPUSD, XAUUSD'),
('Trend Continuation', 'Ride the trend by entering on structural pullbacks after break of structure.', ARRAY['Confirm overall trend on HTF', 'Identify BOS on LTF', 'Wait for pullback to discount/premium', 'Find OB or FVG for entry', 'Set SL at structure invalidation'], ARRAY['Risk 1% per trade', 'Max 3 trades with trend', 'Must have BOS before entry'], ARRAY['Show HTF trend direction', 'Mark BOS on LTF', 'Show OB/FVG entry zone', 'Include entry/SL/TP levels with price'], 'M15 / H1', 'All trending pairs'),
('Order Block Entry', 'Enter at institutional order blocks validated by break of structure.', ARRAY['Identify valid OB (last opposing candle before impulse)', 'Confirm OB caused a BOS', 'Wait for price to return to OB zone', 'Look for LTF confirmation at OB', 'Set SL beyond OB with buffer'], ARRAY['Risk 1% per trade', 'Minimum R:R 1:2', 'OB must be validated by BOS'], ARRAY['Mark the order block clearly', 'Show the BOS it caused', 'Include price returning to OB', 'Show LTF confirmation if used'], 'M15 / H1', 'All major pairs, XAUUSD'),
('Fair Value Gap Fill', 'Trade price filling fair value gaps with entry at consequent encroachment.', ARRAY['Identify displacement move creating FVG', 'Mark FVG zone (3-candle pattern)', 'Wait for price to fill to CE (50%)', 'Confirm direction aligns with HTF bias', 'Set SL beyond full FVG invalidation'], ARRAY['Risk 0.5-1% per trade', 'Minimum R:R 1:2', 'Must align with HTF bias'], ARRAY['Mark the 3-candle FVG pattern', 'Show the CE level', 'Include HTF bias context', 'Show entry and invalidation levels'], 'M5 / M15', 'XAUUSD, GBPUSD, EURUSD'),
('Range Scalp', 'Scalp between range boundaries during low-volatility sessions.', ARRAY['Identify clear range (min 3 touches each side)', 'Mark range high and low precisely', 'Wait for price at range extreme', 'Confirm with rejection candle pattern', 'Use tight SL beyond range edge'], ARRAY['Risk 0.5% per trade', 'Max 4 trades per session', 'Only trade during Asia session or low volatility'], ARRAY['Show the range with clear boundaries', 'Mark at least 3 touches on each side', 'Show current price at range extreme', 'Include the rejection candle'], 'M5 / M15', 'EURUSD, USDJPY during Asia session');