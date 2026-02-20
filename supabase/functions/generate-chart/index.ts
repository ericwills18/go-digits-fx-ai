import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt } = await req.json();
    const IMAGE_GEN_API_KEY = Deno.env.get("IMAGE_GEN_API_KEY");
    if (!IMAGE_GEN_API_KEY) throw new Error("IMAGE_GEN_API_KEY is not configured");

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

    // Try Gemini image generation with the dedicated API key
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${IMAGE_GEN_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: enhancedPrompt }] }],
          generationConfig: {
            responseModalities: ["TEXT", "IMAGE"],
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini image API error:", response.status, t);

      // Fallback: try Imagen model
      const imagenResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${IMAGE_GEN_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instances: [{ prompt: enhancedPrompt }],
            parameters: { sampleCount: 1, aspectRatio: "16:9" },
          }),
        }
      );

      if (!imagenResponse.ok) {
        const t2 = await imagenResponse.text();
        console.error("Imagen API error:", imagenResponse.status, t2);
        return new Response(JSON.stringify({ error: "Failed to generate chart image" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imagenData = await imagenResponse.json();
      const b64 = imagenData.predictions?.[0]?.bytesBase64Encoded;
      if (b64) {
        const imageUrl = `data:image/png;base64,${b64}`;
        return new Response(JSON.stringify({ imageUrl, text: "" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    return new Response(JSON.stringify({ imageUrl, text }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-chart error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
