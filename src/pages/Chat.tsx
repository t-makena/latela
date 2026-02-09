import { useState, useRef, useEffect } from "react";
import { useFinancialChat } from "@/hooks/useFinancialChat";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, Trash2, MessageCircle, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

const SUGGESTED_QUESTIONS = [
  "How much did I spend this month?",
  "What are my biggest expenses?",
  "Am I on track with my savings goals?",
  "Where can I cut spending?",
  "Give me a summary of my finances",
  "How much do I have until payday?",
];

export default function Chat() {
  const { messages, isLoading, sendMessage, clearChat, stopGenerating } =
    useFinancialChat();
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    const ta = e.target;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 150) + "px";
  };

  return (
    <div className={cn(
      "flex flex-col h-[calc(100vh-2rem)]",
      isMobile && "h-[calc(100vh-5rem)] pt-2"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10">
            <Sparkles size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Budget Buddy</h1>
            <p className="text-xs text-muted-foreground">Your AI financial advisor</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={clearChat}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={18} />
          </Button>
        )}
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 pb-8">
            <div className="p-4 rounded-2xl bg-primary/5 border border-border">
              <MessageCircle size={40} className="text-primary/60" />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold">Hi, I'm Budget Buddy! 👋</h2>
              <p className="text-muted-foreground text-sm max-w-sm">
                Ask me anything about your finances. I can help with spending insights,
                budget advice, and savings tips.
              </p>
            </div>
            <div className={cn(
              "grid gap-2 w-full max-w-md",
              isMobile ? "grid-cols-1" : "grid-cols-2"
            )}>
              {SUGGESTED_QUESTIONS.map((question) => (
                <button
                  key={question}
                  onClick={() => sendMessage(question)}
                  className="text-left p-3 rounded-xl border border-border hover:bg-accent/50 transition-colors text-sm text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex",
                msg.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] break-words",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border"
                )}
              >
                {msg.role === "assistant" ? (
                  msg.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_table]:text-xs [&_th]:px-2 [&_td]:px-2">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-primary/60 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                      Thinking...
                    </div>
                  )
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your finances..."
            className="min-h-[44px] max-h-[150px] resize-none rounded-xl text-sm"
            rows={1}
            disabled={isLoading}
          />
          {isLoading ? (
            <Button
              type="button"
              size="icon"
              variant="destructive"
              onClick={stopGenerating}
              className="shrink-0 rounded-xl h-[44px] w-[44px]"
            >
              <Square size={16} />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim()}
              className="shrink-0 rounded-xl h-[44px] w-[44px]"
            >
              <Send size={16} />
            </Button>
          )}
        </form>
      </div>
    </div>
  );
}
