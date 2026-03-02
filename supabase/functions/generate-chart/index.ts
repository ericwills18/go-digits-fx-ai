import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();

    const OPENROUTER_KEY = Deno.env.get("OPENROUTER_API_KEY");
    const API_KEY_1 = Deno.env.get("IMAGE_GEN_API_KEY_1");
    const API_KEY_2 = Deno.env.get("IMAGE_GEN_API_KEY_2");

    const enhancedPrompt = `Generate a PHOTOREALISTIC professional forex trading chart that looks exactly like a screenshot from TradingView or MetaTrader 5. Requirements:
- Dark navy/black background with grid lines
- Professional candlestick chart with proper OHLC candles (green/white for bullish, red for bearish)
- Proper price axis on the right side with realistic forex price numbers
- Time axis at the bottom
- Include volume bars at the bottom of the chart
- Add any relevant indicators (EMAs, RSI, MACD) as overlays or subplots
- Annotations with arrows, horizontal support/resistance lines, entry/exit markers
- The chart should look EXACTLY like a real trading platform screenshot, not a cartoon or illustration
- Include the pair name and timeframe in the top-left corner

Specific chart to generate: ${prompt}`;

    // 1) Try OpenRouter first (preferred)
    if (OPENROUTER_KEY) {
      try {
        const orResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_KEY}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://asphalt-fx.lovable.app",
            "X-Title": "Asphalt FX Chart Generator",
          },
          body: JSON.stringify({
            model: "google/gemini-2.0-flash-exp:free",
            messages: [{ role: "user", content: enhancedPrompt }],
            response_format: { type: "image_url" },
          }),
        });

        if (orResp.ok) {
          const orData = await orResp.json();
          // Try to extract image from various response shapes
          const choice = orData.choices?.[0];
          const imageUrl = choice?.message?.images?.[0]?.image_url?.url
            || choice?.message?.content;
          
          // Check if we got a base64 image or a URL
          if (imageUrl && (imageUrl.startsWith("data:image") || imageUrl.startsWith("http"))) {
            return new Response(JSON.stringify({ imageUrl, text: "" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          const t = await orResp.text();
          console.error("OpenRouter error:", orResp.status, t);
        }
      } catch (orErr) {
        console.error("OpenRouter attempt failed:", orErr);
      }
    }

    // 2) Fallback to Gemini API keys
    const apiKeys = [API_KEY_1, API_KEY_2].filter(Boolean) as string[];
    if (apiKeys.length === 0 && !OPENROUTER_KEY) {
      throw new Error("No image generation API keys configured");
    }

    for (const apiKey of apiKeys) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: enhancedPrompt }] }],
              generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
            }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          const parts = data.candidates?.[0]?.content?.parts || [];
          let imageUrl = null;
          let text = "";
          for (const part of parts) {
            if (part.inlineData) {
              imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            } else if (part.text) {
              text = part.text;
            }
          }
          if (imageUrl) {
            return new Response(JSON.stringify({ imageUrl, text }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        } else {
          console.error(`Gemini error: ${response.status}`, await response.text());
        }

        // Fallback: Imagen
        const imagenResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              instances: [{ prompt: enhancedPrompt }],
              parameters: { sampleCount: 1, aspectRatio: "16:9" },
            }),
          }
        );

        if (imagenResponse.ok) {
          const imagenData = await imagenResponse.json();
          const b64 = imagenData.predictions?.[0]?.bytesBase64Encoded;
          if (b64) {
            return new Response(JSON.stringify({ imageUrl: `data:image/png;base64,${b64}`, text: "" }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
        }
      } catch (keyErr) {
        console.error("Key attempt failed:", keyErr);
        continue;
      }
    }

    return new Response(JSON.stringify({ error: "Failed to generate chart image with all available keys" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-chart error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
