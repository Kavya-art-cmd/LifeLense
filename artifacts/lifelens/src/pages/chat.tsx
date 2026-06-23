import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useListConversations, useCreateConversation, useGetConversation, getListConversationsQueryKey, getGetConversationQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Plus, Send, Bot, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

export default function Chat() {
  const [activeConvId, setActiveConvId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useListConversations();
  const createConv = useCreateConversation();
  
  const { data: activeConv } = useGetConversation(activeConvId!, {
    query: { enabled: !!activeConvId, queryKey: getGetConversationQueryKey(activeConvId!) }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConv?.messages, streamingContent]);

  const handleNewChat = () => {
    createConv.mutate({ data: { title: "New Neural Link" } }, {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: getListConversationsQueryKey() });
        setActiveConvId(data.id);
      }
    });
  };

  const [optimisticUserMsg, setOptimisticUserMsg] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeConvId || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    setOptimisticUserMsg(userMsg);
    setIsStreaming(true);
    setStreamingContent("");

    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg })
      });

      if (!res.ok) throw new Error("Failed to send");

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const lines = decoder.decode(value).split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6)) as { content?: string; done?: boolean };
              if (data.done) break;
              if (data.content) {
                setStreamingContent(prev => prev + data.content);
              }
            } catch {
              // ignore parse errors on incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
      setOptimisticUserMsg(null);
      // Use the correct generated query key
      queryClient.invalidateQueries({ queryKey: getGetConversationQueryKey(activeConvId!) });
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-6rem)] flex gap-6">
        {/* Sidebar */}
        <div className="w-80 flex flex-col gap-4">
          <Button onClick={handleNewChat} className="w-full bg-primary hover:bg-primary/90 glow-blue text-white h-12" disabled={createConv.isPending}>
            <Plus className="w-4 h-4 mr-2" /> Initialize Link
          </Button>
          
          <div className="glass-panel border-white/10 rounded-xl flex-1 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-white/5 font-semibold text-sm tracking-widest uppercase text-muted-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4" /> Active Links
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {conversations?.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConvId(conv.id)}
                    className={`w-full text-left p-3 rounded-lg text-sm transition-all ${
                      activeConvId === conv.id 
                        ? "bg-primary/20 border border-primary/50 text-white" 
                        : "hover:bg-white/5 text-muted-foreground hover:text-white"
                    }`}
                  >
                    <div className="font-medium truncate">{conv.title}</div>
                    <div className="text-xs opacity-50 mt-1">{format(new Date(conv.createdAt), "MMM d, h:mm a")}</div>
                  </button>
                ))}
                {conversations?.length === 0 && (
                  <div className="text-center p-4 text-xs text-muted-foreground">No active neural links.</div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 glass-panel border-white/10 rounded-xl flex flex-col overflow-hidden relative">
          {activeConvId ? (
            <>
              {/* Header */}
              <div className="h-16 border-b border-white/5 flex items-center px-6 bg-black/20">
                <h2 className="font-semibold">{activeConv?.title || "Connecting..."}</h2>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6 max-w-3xl mx-auto">
                  {activeConv?.messages.map((msg) => (
                    <motion.div 
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        msg.role === 'user' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary glow-blue'
                      }`}>
                        {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>
                      <div className={`p-4 rounded-2xl max-w-[80%] ${
                        msg.role === 'user' 
                          ? 'bg-secondary/10 border border-secondary/20 text-white rounded-tr-sm' 
                          : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Optimistic user message — shown immediately while AI is responding */}
                  {optimisticUserMsg && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4 flex-row-reverse"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-secondary/20 text-secondary">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="p-4 rounded-2xl max-w-[80%] bg-secondary/10 border border-secondary/20 text-white rounded-tr-sm">
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{optimisticUserMsg}</p>
                      </div>
                    </motion.div>
                  )}

                  {/* Streaming AI response */}
                  {isStreaming && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-4"
                    >
                      <div className="w-8 h-8 rounded-full bg-primary/20 text-primary glow-blue flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                      <div className="p-4 rounded-2xl max-w-[80%] bg-white/5 border border-white/10 text-white/90 rounded-tl-sm min-w-[60px]">
                        {streamingContent ? (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{streamingContent}</p>
                        ) : (
                          <div className="flex gap-1 items-center h-5">
                            <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                            <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                            <motion.div className="w-1.5 h-1.5 bg-primary rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 bg-black/40 border-t border-white/5">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto flex gap-2">
                  <Input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Message Core..."
                    className="flex-1 bg-white/5 border-white/10 focus-visible:ring-primary h-12 rounded-xl"
                    disabled={isStreaming}
                  />
                  <Button 
                    type="submit" 
                    disabled={!input.trim() || isStreaming}
                    className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-white shrink-0"
                  >
                    {isStreaming ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Bot className="w-16 h-16 mb-4 opacity-20" />
              <p>Select or initialize a neural link to begin.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}