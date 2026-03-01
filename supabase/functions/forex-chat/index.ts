import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FOREX_SYSTEM_PROMPT } from "./system-prompt.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, strategy } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

    const systemInstruction = strategy
      ? FOREX_SYSTEM_PROMPT + `\n\nThe user has selected the "${strategy}" strategy. Focus on this strategy and ALWAYS generate a chart image illustrating it when explaining.`
      : FOREX_SYSTEM_PROMPT;

    const geminiContents = messages.map((m: any) => {
      const parts: any[] = [];
      if (Array.isArray(m.content)) {
        for (const part of m.content) {
          if (part.type === "text") {
            parts.push({ text: part.text });
          } else if (part.type === "image_url") {
            const url = part.image_url.url;
            if (url.startsWith("data:")) {
              const [meta, base64] = url.split(",");
              const mimeType = meta.match(/data:(.*?);/)?.[1] || "image/jpeg";
              parts.push({ inlineData: { mimeType, data: base64 } });
            }
          }
        }
      } else {
        parts.push({ text: m.content });
      }
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: geminiContents,
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 3000,
          },
        }),
      }
    );

    if (!response.ok) {
      const t = await response.text();
      console.error("Gemini API error:", response.status, t);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      try {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          let newlineIdx;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            let line = buffer.slice(0, newlineIdx);
            buffer = buffer.slice(newlineIdx + 1);
            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (!jsonStr) continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                const chunk = { choices: [{ delta: { content: text } }] };
                await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
            } catch { /* skip partial JSON */ }
          }
        }
        await writer.write(encoder.encode("data: [DONE]\n\n"));
      } catch (e) {
        console.error("Stream transform error:", e);
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("forex-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
