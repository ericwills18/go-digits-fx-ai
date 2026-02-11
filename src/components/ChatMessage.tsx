import ReactMarkdown from "react-markdown";
import { TrendingUp } from "lucide-react";

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
            <div className="rounded-lg overflow-hidden border border-border">
              <img src={image} alt="Chart" className="max-w-full max-h-64 object-contain" />
            </div>
          )}
          <div className="bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center flex-shrink-0 mt-0.5">
        <TrendingUp className="w-3.5 h-3.5 text-foreground" />
      </div>
      <div className="max-w-[85%] bg-card border border-border px-4 py-3 rounded-2xl rounded-bl-md">
        <div className="chat-prose text-foreground">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
