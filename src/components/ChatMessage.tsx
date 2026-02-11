import ReactMarkdown from "react-markdown";
import { BarChart3 } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  image?: string;
}

export function ChatMessage({ role, content, image }: ChatMessageProps) {
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

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <BarChart3 className="w-4 h-4 text-primary" />
      </div>
      <div className="max-w-[85%] glass-card px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
        <div className="chat-prose text-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
