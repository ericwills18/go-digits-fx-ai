import ReactMarkdown from "react-markdown";
import { BarChart3, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

const CHART_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-chart`;

export function ChatMessage({ role, content, image }: ChatMessageProps) {
  const [chartImages, setChartImages] = useState<Record<string, string>>({});
  const [loadingCharts, setLoadingCharts] = useState<Set<string>>(new Set());

  // Detect [GENERATE_CHART: ...] patterns and generate images
  useEffect(() => {
    if (role !== "assistant") return;
    const regex = /\[GENERATE_CHART:\s*(.+?)\]/g;
    let match;
    const prompts: string[] = [];
    while ((match = regex.exec(content)) !== null) {
      prompts.push(match[1]);
    }
    prompts.forEach(async (prompt) => {
      if (chartImages[prompt] || loadingCharts.has(prompt)) return;
      setLoadingCharts((prev) => new Set(prev).add(prompt));
      try {
        const resp = await fetch(CHART_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ prompt }),
        });
        const data = await resp.json();
        if (data.imageUrl) {
          setChartImages((prev) => ({ ...prev, [prompt]: data.imageUrl }));
        }
      } catch (e) {
        console.error("Chart generation failed:", e);
      } finally {
        setLoadingCharts((prev) => {
          const next = new Set(prev);
          next.delete(prompt);
          return next;
        });
      }
    });
  }, [content, role]);

  // Replace [GENERATE_CHART: ...] with placeholder text for rendering
  const cleanContent = content.replace(/\[GENERATE_CHART:\s*(.+?)\]/g, "");

  if (role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[80%] space-y-2">
          {image && (
            <div className="rounded-xl overflow-hidden border border-border shadow-sm">
              <img src={image} alt="Chart" className="max-w-full max-h-64 object-contain" />
            </div>
          )}
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-sm text-sm shadow-md">
            {content}
          </div>
        </div>
      </div>
    );
  }

  // Extract chart prompts for display
  const chartPrompts: string[] = [];
  const regex = /\[GENERATE_CHART:\s*(.+?)\]/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    chartPrompts.push(m[1]);
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <BarChart3 className="w-4 h-4 text-primary" />
      </div>
      <div className="max-w-[85%] glass-card px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="chat-prose text-foreground">
          <ReactMarkdown>{cleanContent}</ReactMarkdown>
        </div>
        {/* Render generated chart images */}
        {chartPrompts.map((prompt, i) => (
          <div key={i} className="mt-3">
            {loadingCharts.has(prompt) ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating chart illustration...
              </div>
            ) : chartImages[prompt] ? (
              <img
                src={chartImages[prompt]}
                alt="Generated chart"
                className="rounded-xl border border-border max-w-full shadow-sm"
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
