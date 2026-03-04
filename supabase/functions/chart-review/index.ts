import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEFAULT_PROMPT = `You are a trading analysis assistant. Your job is to audit the user's chart-based analysis using the selected strategy. Use the strategy checklist and risk rules. You will be given a screenshot of the chart (with the user's drawings), plus the user's Entry/Stop/Take-profit numbers. Output ONLY valid JSON matching the specified response schema. Be strict. If anything is not visible in the screenshot, mark it as unclear and request a new screenshot following the screenshot requirements. Do not invent levels or signals not supported by what you can see.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      strategy_id,
      entry_price,
      stop_loss_price,
      take_profit_price,
      account_size,
      risk_percent,
      timeframe,
      symbol,
      screenshot_url,
      chat_messages,
    } = await req.json();

    // If this is a chat message (no screenshot cross-check), handle it differently
    const isChatMode = !!chat_messages && !screenshot_url;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let strategy: any = null;
    if (strategy_id) {
      const { data } = await sb
        .from("strategies")
        .select("*")
        .eq("id", strategy_id)
        .single();
      strategy = data;
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (isChatMode) {
      // Chat mode: streaming conversation about the strategy
      const systemContent = strategy
        ? `You are a trading analysis assistant specializing in the "${strategy.name}" strategy.\n\nStrategy: ${strategy.description}\nChecklist: ${(strategy.checklist_steps || []).join(", ")}\nRisk rules: ${(strategy.risk_rules || []).join(", ")}\nTimeframe: ${strategy.timeframe || "Any"}\nAssets: ${strategy.assets || "Any"}\n\nAlways reference these rules when giving advice. Be educational. No guaranteed profits. Label: "Practice analysis. Educational coaching. Not financial advice."`
        : `You are a trading analysis assistant. Help the user with chart analysis and trading strategies. Be educational. No guaranteed profits.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemContent },
            ...chat_messages,
          ],
          stream: true,
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "Usage limit reached. Please add credits." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI error:", status, t);
        throw new Error("AI gateway error");
      }

      return new Response(response.body, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // Cross-check mode: structured JSON review
    if (!strategy) {
      return new Response(JSON.stringify({ error: "Strategy not found" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = strategy.ai_prompt_template || DEFAULT_PROMPT;

    const userContent: any[] = [];
    
    if (screenshot_url) {
      userContent.push({
        type: "image_url",
        image_url: { url: screenshot_url },
      });
    }

    let textPrompt = `Strategy: ${strategy.name}\nDescription: ${strategy.description}\n`;
    textPrompt += `Checklist steps:\n${(strategy.checklist_steps || []).map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}\n`;
    textPrompt += `Risk rules:\n${(strategy.risk_rules || []).map((r: string) => `- ${r}`).join("\n")}\n`;
    textPrompt += `Screenshot requirements:\n${(strategy.screenshot_requirements || []).map((r: string) => `- ${r}`).join("\n")}\n\n`;
    textPrompt += `User's trade setup:\n- Entry: ${entry_price}\n- Stop Loss: ${stop_loss_price}\n- Take Profit: ${take_profit_price}\n`;
    if (account_size) textPrompt += `- Account Size: ${account_size}\n`;
    if (risk_percent) textPrompt += `- Risk %: ${risk_percent}\n`;
    if (timeframe) textPrompt += `- Timeframe: ${timeframe}\n`;
    if (symbol) textPrompt += `- Symbol: ${symbol}\n`;

    textPrompt += `\nRespond with ONLY valid JSON in this exact format:
{
  "checklist_audit": [{"step":"...","status":"pass|fail|unclear","note":"..."}],
  "chart_summary": {"bias":"bullish|bearish|neutral|unclear","structure":"...","key_levels":["..."]},
  "trade_validation": {"entry_quality":"good|early|late|invalid|unclear","invalidation":"...","targets":["..."]},
  "risk_review": {"rr":"...","warnings":["..."],"max_loss":"...","position_size":"..."},
  "corrections":["..."],
  "follow_up_questions":["..."]
}`;

    userContent.push({ type: "text", text: textPrompt });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Usage limit reached." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";
    
    // Try to parse JSON from AI response
    let parsed;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: content };
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chart-review error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
