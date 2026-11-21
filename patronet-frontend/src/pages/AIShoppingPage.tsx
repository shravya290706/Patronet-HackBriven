import * as React from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import {
  Sparkles,
  Send,
  RotateCcw,
  Bot,
  User,
  ShoppingCart,
  ExternalLink,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { useCart } from "@/context/CartContext";
import {
  assistantService,
  type ProductRecommendationItem,
} from "@/services";

interface ChatMessage {
  id: string;
  sender: "user" | "assistant";
  content: string;
  recommendations?: ProductRecommendationItem[];
  suggestedQueries?: string[];
  isAiPowered?: boolean;
  modelUsed?: string | null;
  timestamp: string;
}

const INITIAL_SUGGESTIONS = [
  "Find headphones under ₹3,000",
  "Which laptop is best for programming?",
  "I need a gift for my friend under ₹5,000",
  "Show me top noise-cancelling earphones",
  "Cheaper alternative to MacBook",
  "Best smartwatches for fitness tracking",
];

export const AIShoppingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { addItem } = useCart();
  const initialTriggerRef = React.useRef(false);
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      sender: "assistant",
      content:
        "Hello! I am your PATRONET Shopping Buddy. Tell me what you're shopping for, your budget constraints, or computational workload requirements, and I'll find the best verified hardware from our catalogue.",
      suggestedQueries: INITIAL_SUGGESTIONS.slice(0, 4),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const [inputQuery, setInputQuery] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [addingId, setAddingId] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle auto-trigger from URL query or location state
  React.useEffect(() => {
    if (initialTriggerRef.current) return;
    const urlQuery = searchParams.get("q");
    const statePrompt = (location.state as { prompt?: string })?.prompt;
    const query = (urlQuery || statePrompt || "").trim();
    if (query) {
      initialTriggerRef.current = true;
      handleSendMessage(query);
    }
  }, [searchParams, location.state]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || loading) return;

    setInputQuery("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Build lightweight conversation history
      const historyPayload = messages.slice(-4).map((m) => ({
        role: m.sender,
        content: m.content,
      }));

      const response = await assistantService.chat(query, historyPayload);

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        content: response.reply,
        recommendations: response.recommendations || [],
        suggestedQueries: response.suggested_queries || [],
        isAiPowered: response.is_ai_powered,
        modelUsed: response.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `assistant-err-${Date.now()}`,
        sender: "assistant",
        content:
          "I ran into an issue connecting to our recommendation engine. Please try rephrasing your request or browse by category.",
        suggestedQueries: ["Browse Laptops", "Browse Headphones", "Browse Smartwatches"],
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: ProductRecommendationItem) => {
    setAddingId(product.id);
    try {
      await addItem(product.id, 1);
      toast.success(`Added 1 × ${product.name} to cart.`);
    } catch {
      toast.error(`Could not add ${product.name} to cart.`);
    } finally {
      setAddingId(null);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "assistant",
        content:
          "Chat reset! What hardware or accessories would you like assistance with today?",
        suggestedQueries: INITIAL_SUGGESTIONS.slice(0, 4),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Shopping Buddy" }]}
        badge="USP 3: Conversational Discovery"
        title="Shopping Buddy: AI Shopping Assistant"
        description="Describe requirements, budgets, or workloads in natural language. Powered by intelligent catalogue search and specification matching."
      />

      <div className="max-w-4xl mx-auto flex flex-col h-[750px] max-h-[85vh] bg-surface-container-lowest border border-surface-container rounded-2xl shadow-sm overflow-hidden">
        {/* Assistant Header */}
        <div className="px-5 py-3.5 bg-surface-container-low/60 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface-container-lowest" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-title text-base font-bold text-on-surface">
                  Shopping Buddy
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-950 font-bold text-[10px] uppercase tracking-wider">
                  Active
                </span>
              </div>
              <p className="text-xs text-muted-gray">
                Natural language discovery across 48 verified hardware products
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetChat}
            title="Reset conversation"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-gray hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Chat</span>
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-surface-container-lowest">
          {messages.map((msg) => {
            const isBot = msg.sender === "assistant";
            return (
              <div
                key={msg.id}
                className={`flex gap-3 sm:gap-4 ${isBot ? "items-start" : "items-start flex-row-reverse"}`}
              >
                {/* Avatar */}
                <div
                  className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold ${
                    isBot
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "bg-primary text-on-primary shadow-2xs"
                  }`}
                >
                  {isBot ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className={`space-y-3 max-w-[85%] sm:max-w-[78%] ${isBot ? "" : "text-right"}`}>
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed text-left shadow-2xs whitespace-pre-line ${
                      isBot
                        ? "bg-surface-container-low text-on-surface border border-surface-container/70 rounded-tl-xs"
                        : "bg-primary text-on-primary rounded-tr-xs ml-auto"
                    }`}
                  >
                    {isBot && msg.isAiPowered && (
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                          <Sparkles className="w-2.5 h-2.5" />
                          {msg.modelUsed || "Gemini 2.5 Flash"}
                        </span>
                      </div>
                    )}
                    {msg.content}
                  </div>

                  {/* Embedded Rich Product Recommendation Cards */}
                  {isBot && msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                      {msg.recommendations.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-surface-container-lowest border border-surface-container hover:border-emerald-500/50 rounded-xl p-3 flex flex-col justify-between shadow-xs transition-all hover:shadow-sm"
                        >
                          <div>
                            {/* Product Thumbnail */}
                            <div className="relative aspect-video w-full bg-surface-container-low rounded-lg p-2 mb-2 flex items-center justify-center overflow-hidden border border-surface-container/40">
                              {rec.primary_image_url ? (
                                <img
                                  src={rec.primary_image_url}
                                  alt={rec.name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                />
                              ) : (
                                <Tag className="w-6 h-6 text-muted-gray" />
                              )}
                              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-surface-container-high/90 text-primary font-bold text-[9px] uppercase tracking-wider">
                                {rec.brand || "Hardware"}
                              </span>
                            </div>

                            {/* Name & Price */}
                            <Link
                              to={`/products/${rec.id}`}
                              className="font-title text-xs sm:text-sm font-bold text-on-surface hover:text-primary transition-colors line-clamp-2"
                            >
                              {rec.name}
                            </Link>

                            <div className="mt-1 flex items-baseline gap-1.5">
                              <span className="text-sm font-bold text-primary tabular-nums">
                                ₹{Number(rec.price).toLocaleString("en-IN")}
                              </span>
                            </div>

                            {/* Match Reason Tag */}
                            {rec.match_reason && (
                              <div className="mt-2 p-1.5 rounded-md bg-emerald-50 border border-emerald-200/60 text-emerald-950 text-[11px] leading-tight flex items-start gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-700 shrink-0 mt-0.5" />
                                <span>{rec.match_reason}</span>
                              </div>
                            )}

                            {/* Key Specs Pills */}
                            {rec.key_specs && Object.keys(rec.key_specs).length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {Object.entries(rec.key_specs).slice(0, 2).map(([k, v]) => (
                                  <span
                                    key={k}
                                    className="px-1.5 py-0.5 rounded bg-surface-container-high text-[10px] text-muted-gray font-medium"
                                  >
                                    {k}: {String(v)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="mt-3 pt-2 border-t border-surface-container flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAddToCart(rec)}
                              disabled={addingId === rec.id}
                              className="flex-1 py-1.5 px-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                              <span>{addingId === rec.id ? "Adding..." : "Add to Cart"}</span>
                            </button>

                            <Link
                              to={`/products/${rec.id}`}
                              title="Open product page"
                              className="p-1.5 rounded-lg border border-surface-container hover:bg-surface-container-high text-muted-gray hover:text-on-surface transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Follow-up Chips */}
                  {isBot && msg.suggestedQueries && msg.suggestedQueries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestedQueries.map((sq, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(sq)}
                          className="px-2.5 py-1 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-medium text-xs border border-surface-container transition-all cursor-pointer hover:border-primary/40 hover:-translate-y-0.5 active:translate-y-0 text-left"
                        >
                          {sq} &rarr;
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-muted-gray block px-1">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="bg-surface-container-low rounded-2xl px-4 py-3 border border-surface-container flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Query Input Bar */}
        <div className="p-3 sm:p-4 bg-surface-container-low/40 border-t border-surface-container">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything (e.g., 'Headphones under ₹3,000' or 'Best laptop for programming')..."
              className="flex-1 px-4 py-3 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-muted-gray focus:outline-none focus:border-primary shadow-2xs"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-label text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </Container>
  );
};
