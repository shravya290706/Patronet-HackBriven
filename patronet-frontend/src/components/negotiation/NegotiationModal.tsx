import * as React from "react";
import {
  Handshake,
  X,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShoppingCart,
  TrendingDown,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  negotiationService,
  type NegotiationSessionModel,
} from "@/services";
import { getProductPrimaryImageUrl } from "@/lib/imageUtils";
import type { Product } from "@/types";

export interface NegotiationModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export const NegotiationModal: React.FC<NegotiationModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem } = useCart();
  const { isAuthenticated } = useAuth();

  const [session, setSession] = React.useState<NegotiationSessionModel | null>(null);
  const [offerInput, setOfferInput] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [actionLoading, setActionLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Initialize or fetch session when modal opens
  React.useEffect(() => {
    if (!isOpen || !product) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    negotiationService
      .startNegotiation(product.id)
      .then((res) => {
        if (isMounted) {
          setSession(res);
          // Suggest opening offer around 10% discount
          const suggested = Math.round(product.price * 0.9);
          setOfferInput(String(suggested));
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to initialize negotiation");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, product]);

  React.useEffect(() => {
    if (session?.history?.length) {
      scrollToBottom();
    }
  }, [session?.history]);

  if (!isOpen) return null;

  const originalPrice = product.price;
  const numOffer = parseFloat(offerInput) || 0;
  const discountPct = originalPrice > 0 && numOffer > 0
    ? Math.max(0, Math.round(((originalPrice - numOffer) / originalPrice) * 100))
    : 0;

  const handleQuickPercent = (pct: number) => {
    const val = Math.round(originalPrice * (1 - pct / 100));
    setOfferInput(String(val));
  };

  const handleSubmitOffer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!session || actionLoading) return;

    const offer = parseFloat(offerInput);
    if (!offer || offer <= 0) {
      toast.error("Please enter a valid offer amount.");
      return;
    }

    if (offer > originalPrice) {
      toast.info("Your offer is above the listed price!");
    }

    setActionLoading(true);
    setError(null);

    try {
      const updated = await negotiationService.submitOffer(session.id, offer);
      setSession(updated);

      if (updated.status === "accepted") {
        toast.success(`Deal Accepted! Locked in at ₹${updated.agreed_price?.toLocaleString("en-IN")}`);
      } else if (updated.status === "counteroffer") {
        toast.info(`Counteroffer received: ₹${updated.counter_offer?.toLocaleString("en-IN")}`);
      } else if (updated.status === "rejected") {
        toast.error("Offer rejected. Please propose a realistic amount.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit offer";
      setError(msg);
      toast.error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptCounter = async () => {
    if (!session || actionLoading) return;
    setActionLoading(true);
    try {
      const updated = await negotiationService.acceptCounteroffer(session.id);
      setSession(updated);
      toast.success(`Counteroffer accepted at ₹${updated.agreed_price?.toLocaleString("en-IN")}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept counteroffer");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddToCartAtNegotiatedPrice = async () => {
    if (!session || session.status !== "accepted" || !session.agreed_price) {
      toast.error("No accepted deal to add to cart.");
      return;
    }

    if (!isAuthenticated) {
      toast.warning("Please sign in to proceed with your negotiated order.");
      return;
    }

    setActionLoading(true);
    try {
      await addItem(product.id, 1, session.id);
      toast.success(
        `Added ${product.name} to your cart at negotiated price of ₹${session.agreed_price.toLocaleString("en-IN")}!`
      );
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add negotiated item to cart.");
    } finally {
      setActionLoading(false);
    }
  };

  const imgUrl = getProductPrimaryImageUrl(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-deep-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-surface-container-low/70 border-b border-surface-container flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-900 border border-amber-300">
              <Handshake className="w-5 h-5 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-title text-base sm:text-lg font-bold text-on-surface">
                  Price Negotiator
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                  USP 2: Bargain Demo
                </span>
              </div>
              <p className="text-xs text-muted-gray">
                Bargain directly with automated supplier pricing algorithms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close negotiator"
            className="p-1.5 rounded-full text-muted-gray hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Product Snapshot Bar */}
        <div className="px-5 py-3 bg-surface-container-lowest border-b border-surface-container/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-surface-container-low rounded-lg p-1 shrink-0 flex items-center justify-center border border-surface-container">
              <img src={imgUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-gray block">
                {product.brand}
              </span>
              <p className="font-semibold text-xs sm:text-sm text-on-surface truncate">
                {product.name}
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[11px] text-muted-gray block">Listed Price</span>
            <span className="text-sm sm:text-base font-bold text-primary tabular-nums">
              ₹{originalPrice.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Status & Rounds Banner */}
        {session && (
          <div className="px-5 py-2.5 bg-surface-container-low/40 border-b border-surface-container/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-muted-gray font-medium">Status:</span>
              {session.status === "accepted" ? (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Deal Accepted!
                </span>
              ) : session.status === "counteroffer" ? (
                <span className="inline-flex items-center gap-1 font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Counteroffer Available
                </span>
              ) : session.status === "rejected" ? (
                <span className="inline-flex items-center gap-1 font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-md">
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                  Offer Below Floor
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  In Negotiation
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {session.is_ai_powered && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-[11px] border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Gemini Bargaining
                </span>
              )}
              <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                <span>Round {session.round_number} of {session.max_rounds}</span>
              </div>
            </div>
          </div>
        )}

        {/* Dialogue / Negotiation History Chat Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 min-h-[220px] max-h-[360px] bg-surface-container-lowest">
          {loading ? (
            <div className="py-12 text-center text-muted-gray text-xs sm:text-sm animate-pulse">
              Connecting to supplier pricing engine...
            </div>
          ) : session ? (
            session.history.map((msg, index) => {
              const isSeller = msg.sender === "seller";
              return (
                <div
                  key={index}
                  className={`flex flex-col ${isSeller ? "items-start" : "items-end"} max-w-[85%] ${
                    isSeller ? "self-start" : "self-end ml-auto"
                  }`}
                >
                  <span className="text-[10px] text-muted-gray font-medium mb-1 px-1">
                    {isSeller ? "Patronet Pricing Bot" : "You (Customer)"}
                  </span>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isSeller
                        ? "bg-surface-container-low text-on-surface border border-surface-container rounded-tl-xs"
                        : "bg-primary text-on-primary rounded-tr-xs"
                    }`}
                  >
                    <p>{msg.message}</p>
                    {msg.counter_offer && isSeller && (
                      <div className="mt-2 pt-2 border-t border-surface-container flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-primary">
                          Counteroffer: ₹{msg.counter_offer.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                          Save ₹{(originalPrice - msg.counter_offer).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : error ? (
            <div className="py-8 text-center text-red-600 text-xs sm:text-sm">
              {error}
            </div>
          ) : null}
          <div ref={messagesEndRef} />
        </div>

        {/* Active Counteroffer Banner Action */}
        {session?.status === "counteroffer" && session.counter_offer && (
          <div className="px-5 py-3 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-t border-blue-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-blue-950 block">
                Seller Counteroffer: ₹{session.counter_offer.toLocaleString("en-IN")}
              </span>
              <span className="text-[11px] text-blue-800">
                You save ₹{(originalPrice - session.counter_offer).toLocaleString("en-IN")} off retail price!
              </span>
            </div>
            <button
              type="button"
              onClick={handleAcceptCounter}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-label text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              {actionLoading ? "Processing..." : "Accept Counteroffer"}
            </button>
          </div>
        )}

        {/* Accepted Deal Action */}
        {session?.status === "accepted" && session.agreed_price && (
          <div className="px-5 py-4 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-t border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <span className="text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Agreed Price: ₹{session.agreed_price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs text-emerald-800">
                Total savings: ₹{(originalPrice - session.agreed_price).toLocaleString("en-IN")} (
                {Math.round(((originalPrice - session.agreed_price) / originalPrice) * 100)}% off)
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddToCartAtNegotiatedPrice}
              disabled={actionLoading}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-label text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer shrink-0 disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{actionLoading ? "Adding..." : "Add to Cart at Negotiated Price"}</span>
            </button>
          </div>
        )}

        {/* Input Bar (Only active when negotiation is open) */}
        {session && session.status !== "accepted" && session.round_number < session.max_rounds && (
          <form
            onSubmit={handleSubmitOffer}
            className="p-4 sm:p-5 bg-surface-container-low/50 border-t border-surface-container space-y-3"
          >
            {/* Quick Discount Percent Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-medium text-muted-gray mr-1 flex items-center gap-1">
                <TrendingDown className="w-3 h-3 text-primary" />
                Quick Offer:
              </span>
              {[5, 10, 15, 20].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleQuickPercent(pct)}
                  className="px-2 py-0.5 rounded-md bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-[11px] transition-colors cursor-pointer"
                >
                  −{pct}% (₹{Math.round(originalPrice * (1 - pct / 100)).toLocaleString("en-IN")})
                </button>
              ))}
            </div>

            {/* Price Input and Submit */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-gray font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  max={originalPrice * 2}
                  value={offerInput}
                  onChange={(e) => setOfferInput(e.target.value)}
                  placeholder="Enter your proposed price in INR"
                  className="w-full pl-7 pr-16 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl text-sm font-bold text-on-surface focus:outline-none focus:border-primary"
                />
                {discountPct > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {discountPct}% off
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={actionLoading || !offerInput || parseFloat(offerInput) <= 0}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-label text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>{actionLoading ? "Submitting..." : "Submit Offer"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Negotiation Exhausted / Closed State */}
        {session && session.status !== "accepted" && session.round_number >= session.max_rounds && (
          <div className="p-4 bg-surface-container-low/70 border-t border-surface-container flex items-center justify-between text-xs">
            <span className="text-muted-gray">
              Maximum negotiation rounds reached for this session.
            </span>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                negotiationService.startNegotiation(product.id).then(setSession).finally(() => setLoading(false));
              }}
              className="inline-flex items-center gap-1 text-primary hover:underline font-bold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Start New Session</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
