import { useState, useRef, type KeyboardEvent } from "react";
import { Send, Paperclip, X, Settings2, Mic, MicOff } from "lucide-react";

interface ChatInputProps {
  onSend: (message: string, image?: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed && !imagePreview) return;
    onSend(trimmed || "Analyze this chart", imagePreview || undefined);
    setInput("");
    setImagePreview(null);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  return (
    <div className="glass-card rounded-2xl p-3">
      {imagePreview && (
        <div className="mb-2 relative inline-block animate-fade-in-up">
          <img src={imagePreview} alt="Upload" className="h-20 rounded-xl border border-border shadow-sm" />
          <button
            onClick={() => setImagePreview(null)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-sm hover:scale-110 transition-transform"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Ask me anything about forex..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground resize-none outline-none py-2 px-1 disabled:opacity-50"
        />
        <div className="flex items-center gap-1">
          <button
            onClick={toggleVoice}
            disabled={disabled}
            className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${
              isListening
                ? "bg-destructive text-destructive-foreground animate-pulse"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            }`}
            title={isListening ? "Stop listening" : "Voice input"}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 disabled:opacity-50"
            title="Upload chart screenshot"
          >
            <Paperclip className="w-4 h-4" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={handleSend}
            disabled={disabled || (!input.trim() && !imagePreview)}
            className="send-pulse p-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-all duration-200 disabled:opacity-30"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3 mt-2 pt-2 border-t border-border/50">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <Paperclip className="w-3 h-3" />
          Attach chart
        </button>
        <button
          onClick={toggleVoice}
          disabled={disabled}
          className={`flex items-center gap-1.5 text-[11px] transition-colors ${
            isListening ? "text-destructive" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mic className="w-3 h-3" />
          {isListening ? "Listening..." : "Voice input"}
        </button>
      </div>
    </div>
  );
}
