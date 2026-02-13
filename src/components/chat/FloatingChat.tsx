import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFloatingChat } from "@/contexts/FloatingChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, X, Minus, Sparkles, MessageSquare } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-financial`;

export default function FloatingChat() {
  const { session } = useAuth();
  const { isOpen, close } = useFloatingChat();
  const location = useLocation();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [minimized, setMinimized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Auto-clear after 5 minutes of inactivity
  useEffect(() => {
    if (!isOpen || messages.length === 0) return;
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current >= 300000) {
        handleNewConversation();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isOpen, messages.length]);

  // Auto-close when navigating to /chat
  useEffect(() => {
    if (location.pathname === "/chat" && isOpen) {
      close();
    }
  }, [location.pathname, isOpen, close]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen, minimized]);

  // Load most recent conversation or start fresh
  useEffect(() => {
    if (!isOpen || !session?.user?.id || conversationId) return;
    (async () => {
      const { data } = await supabase
        .from("chat_conversations")
        .select("id")
        .eq("user_id", session.user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      if (data) {
        setConversationId(data.id);
        const { data: msgs } = await supabase
          .from("chat_messages")
          .select("role, content")
          .eq("conversation_id", data.id)
          .order("created_at", { ascending: true });
        if (msgs) setMessages(msgs as Message[]);
      }
    })();
  }, [isOpen, session?.user?.id, conversationId]);

  const createConversation = async (): Promise<string | null> => {
    if (!session?.user?.id) return null;
    const { data, error } = await supabase
      .from("chat_conversations")
      .insert({ user_id: session.user.id, title: "New conversation" })
      .select()
      .single();
    if (error || !data) {
      toast.error("Failed to create conversation");
      return null;
    }
    return data.id;
  };

  const saveMessage = async (convId: string, role: string, content: string) => {
    if (!session?.user?.id) return;
    await supabase.from("chat_messages").insert({
      conversation_id: convId,
      user_id: session.user.id,
      role,
      content,
    });
  };

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    lastActivityRef.current = Date.now();
    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let convId = conversationId;
    if (!convId) {
      convId = await createConversation();
      if (!convId) { setIsLoading(false); return; }
      setConversationId(convId);
    }

    await saveMessage(convId, "user", text);

    if (messages.length === 0) {
      const title = text.slice(0, 60) + (text.length > 60 ? "..." : "");
      await supabase
        .from("chat_conversations")
        .update({ title, updated_at: new Date().toISOString() })
        .eq("id", convId);
    }

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg], conversationId: convId }),
      });

      if (!resp.ok || !resp.body) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.action) {
              const actionType = parsed.action as string;
              if (actionType.includes('goal')) queryClient.invalidateQueries({ queryKey: ['goals'] });
              if (actionType.includes('budget_item')) queryClient.invalidateQueries({ queryKey: ['budget-items'] });
              if (actionType.includes('calendar_event')) queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
              if (actionType.includes('settings')) queryClient.invalidateQueries({ queryKey: ['user-settings'] });
              if (actionType.includes('account')) queryClient.invalidateQueries({ queryKey: ['accounts'] });
              if (actionType.includes('profile')) {
                queryClient.invalidateQueries({ queryKey: ['user-profile'] });
                queryClient.invalidateQueries({ queryKey: ['user-settings'] });
              }
              continue;
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            // partial JSON
          }
        }
      }

      if (assistantSoFar) {
        await saveMessage(convId, "assistant", assistantSoFar);
        await supabase
          .from("chat_conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", convId);
      }
    } catch (e: any) {
      console.error("Floating chat error:", e);
      toast.error(e.message || "Failed to get response");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  if (!isOpen || location.pathname === "/chat") return null;

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setMinimized(false)}
          className="h-12 w-12 rounded-full shadow-lg"
          size="icon"
        >
          <Sparkles size={20} fill="currentColor" strokeWidth={1.5} />
        </Button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col bg-background/60 backdrop-blur-xl border border-border shadow-2xl transition-all duration-300 ease-out",
        isMobile
          ? "bottom-0 left-0 right-0 h-[60vh] rounded-t-2xl"
          : "bottom-4 right-4 w-[420px] h-[500px] rounded-2xl"
      )}
      style={{ animation: "slideUp 0.3s ease-out" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-background/50 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-primary" fill="currentColor" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="font-bold text-sm">Budget Buddy</h3>
            <p className="text-[10px] text-muted-foreground">AI financial advisor</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleNewConversation}>
            <MessageSquare size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMinimized(true)}>
            <Minus size={14} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
            <X size={14} />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Sparkles size={22} className="text-primary" fill="currentColor" strokeWidth={1.5} />
            </div>
            <div>
              <h4 className="font-bold text-sm">Hey! I'm Budget Buddy 👋</h4>
              <p className="text-xs text-muted-foreground max-w-[280px] mt-1">
                Ask me anything about your finances.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 justify-center max-w-[320px]">
              {[
                "How am I doing this month?",
                "Tips to save more money",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-2.5 py-1 text-[11px] rounded-full border border-border hover:bg-accent transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-2xl px-3 py-2 text-xs",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-card border border-border rounded-bl-md"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-xs dark:prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-xs">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-3 py-2">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-2.5 border-t border-border bg-background/50 backdrop-blur-sm">
        <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); lastActivityRef.current = Date.now(); }}
            placeholder="Ask Budget Buddy..."
            disabled={isLoading}
            className="flex-1 bg-background/80 h-9 text-xs"
          />
          <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-9 w-9">
            <Send size={14} />
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
