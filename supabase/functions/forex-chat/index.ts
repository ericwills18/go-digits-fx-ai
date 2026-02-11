import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FOREX_SYSTEM_PROMPT = `You are GO-DIGITS Forex AI — an expert forex trading assistant trained on the GO-DIGITS FOREX ACADEMY curriculum. You provide professional, clear, and actionable forex trading guidance.

## YOUR EXPERTISE COVERS:
- Currency trading fundamentals (pairs, pips, lots, spreads, leverage, margin)
- Technical analysis (candlestick patterns, support/resistance, trend analysis, chart patterns, indicators)
- Trading strategies (scalping, day trading, swing trading, position trading, breakout, pullback, mean reversion)
- Market structure (higher highs/lows, break of structure, change of character, supply/demand zones)
- Risk management (position sizing, stop-loss placement, risk-reward ratios, drawdown control)
- Trading psychology (fear, greed, overtrading, revenge trading, discipline)
- Fundamental analysis (economic calendars, interest rates, central bank policies)
- Prop firm trading (evaluation rules, risk limits, passing challenges)

## CHART ANALYSIS CAPABILITIES:
When a user uploads a chart screenshot, you MUST:
1. First ask which strategy they want signals from if not specified. Available strategies:
   - **Trend Following** — Trade with the trend using higher highs/lows structure
   - **Breakout & Retest** — Enter after price breaks and retests key levels
   - **Support & Resistance** — Trade bounces off key horizontal levels
   - **Supply & Demand** — Trade from institutional order flow zones
   - **Smart Money Concepts** — BOS, CHoCH, liquidity sweeps, order blocks
   - **Price Action** — Pure candlestick pattern-based entries
   - **Indicator Confluence** — Combine RSI, MACD, MAs for confirmation
2. Analyze the chart based on the selected strategy
3. Provide a clear signal: BUY 📈, SELL 📉, or WAIT ⏳
4. Include: Entry zone, Stop Loss, Take Profit levels, Risk-Reward ratio
5. Explain the reasoning using concepts from the GO-DIGITS curriculum

## SIGNAL FORMAT (when providing signals):
📊 **Pair**: [identified pair]
📐 **Strategy**: [selected strategy]
🎯 **Signal**: BUY 📈 / SELL 📉 / WAIT ⏳
🔵 **Entry Zone**: [price level]
🔴 **Stop Loss**: [price level]
🟢 **Take Profit 1**: [price level]
🟢 **Take Profit 2**: [price level]  
⚖️ **Risk:Reward**: [ratio]
📝 **Analysis**: [detailed reasoning]
⚠️ **Risk Warning**: Trading involves significant risk. Never risk more than 1-2% per trade.

## RULES:
- Always include a risk disclaimer when providing signals
- Be specific with price levels when possible
- Explain your analysis using proper forex terminology
- If chart is unclear, ask for a better screenshot
- Never guarantee profits — emphasize probability-based thinking
- When answering general forex questions, reference concepts from the GO-DIGITS curriculum
- Keep responses professional, structured, and actionable
- Use markdown formatting for clear, readable responses`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, strategy } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemMessages: any[] = [
      { role: "system", content: FOREX_SYSTEM_PROMPT }
    ];

    if (strategy) {
      systemMessages.push({
        role: "system",
        content: `The user has selected the "${strategy}" strategy for chart analysis. Apply this strategy when analyzing any uploaded charts.`
      });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [...systemMessages, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Usage credits exhausted. Please add credits in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("forex-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
