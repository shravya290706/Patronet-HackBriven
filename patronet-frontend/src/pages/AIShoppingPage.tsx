import * as React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  X,
  Check,
  ShoppingCart,
  Heart,
  Scale,
  RotateCcw,
  MessageSquare,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/layout/Container';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useComparison } from '@/context/ComparisonContext';
import { aiShoppingService, productService } from '@/services';
import type { AiShoppingMessage } from '@/services/api/aiShoppingService';
import type { Product } from '@/types';
import { getProductPrimaryImageUrl, DEFAULT_PRODUCT_FALLBACK_IMAGE } from '@/lib/imageUtils';

const SESSION_STORAGE_AI_KEY = 'patronet_ai_conversation_v1';

export const AIShoppingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialQueryParam = searchParams.get('q') || '';

  const { addItem: addCartItem } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isSelected: isCompared, toggleProduct: toggleCompareProduct } = useComparison();

  // Conversation Messages State
  const [messages, setMessages] = React.useState<AiShoppingMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(SESSION_STORAGE_AI_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  // Current Input State
  const [inputQuery, setInputQuery] = React.useState<string>(initialQueryParam);
  const [isProcessing, setIsProcessing] = React.useState<boolean>(false);
  const [inputError, setInputError] = React.useState<string | null>(null);
  const [serviceError, setServiceError] = React.useState<string | null>(null);

  // Active Refinement Chips & Products for the latest turn
  const [activeCriteria, setActiveCriteria] = React.useState<Array<{ label: string; value: string }>>([]);
  const [resolvedProducts, setResolvedProducts] = React.useState<Record<string, Product>>({});

  const conversationEndRef = React.useRef<HTMLDivElement>(null);

  // Save conversation state to sessionStorage
  React.useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_STORAGE_AI_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Load product objects for any recommendations
  const loadProductData = React.useCallback(async (productIds: string[]) => {
    for (const id of productIds) {
      if (!resolvedProducts[id]) {
        try {
          const p = await productService.getProductById(id);
          if (p) {
            setResolvedProducts((prev) => ({ ...prev, [id]: p }));
          }
        } catch {
          // ignore
        }
      }
    }
  }, [resolvedProducts]);

  // Scroll to bottom on new message
  React.useEffect(() => {
    if (messages.length > 0) {
      conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isProcessing]);

  // Handle URL query parameter on first mount if messages is empty
  React.useEffect(() => {
    if (initialQueryParam && messages.length === 0) {
      handleSendMessage(initialQueryParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) {
      setInputError('Please describe what you are looking for in more detail.');
      return;
    }
    if (isProcessing) return;

    setInputError(null);
    setServiceError(null);

    const userMsg: AiShoppingMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const historyPayload = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await aiShoppingService.sendMessage({
        message: trimmed,
        history: historyPayload,
      });

      const assistantMsg: AiShoppingMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        recommendations: response.recommendations,
        understoodCriteria: response.understoodCriteria,
        suggestedFollowUps: response.suggestedFollowUps,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (response.understoodCriteria) {
        setActiveCriteria(response.understoodCriteria);
      }

      // Prefetch product details for cards
      const ids = response.recommendations.map((r) => r.productId);
      loadProductData(ids);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to retrieve AI recommendations.';
      setServiceError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputQuery);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputQuery);
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setActiveCriteria([]);
    sessionStorage.removeItem(SESSION_STORAGE_AI_KEY);
    toast.info('Conversation reset.');
  };

  const handleRemoveCriterion = (indexToRemove: number) => {
    const updated = activeCriteria.filter((_, idx) => idx !== indexToRemove);
    setActiveCriteria(updated);
    // Follow up request with updated criteria
    const criteriaSummary = updated.map((c) => `${c.label}: ${c.value}`).join(', ');
    handleSendMessage(`Please update results based on criteria: ${criteriaSummary}`);
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addCartItem(product.id, 1);
      toast.success(`Added 1 × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    }
  };

  const handleToggleWishlist = async (product: Product) => {
    try {
      const isSaved = await toggleWishlist(product.id);
      toast.info(isSaved ? `Saved ${product.name} to wishlist.` : `Removed ${product.name} from wishlist.`);
    } catch {
      toast.error('Failed to update wishlist.');
    }
  };

  const suggestedPrompts = [
    'Best laptop under ₹80,000 for programming and battery life',
    'Wireless headphones with active noise cancellation for meetings',
    '27-inch monitor for coding and content creation under ₹30,000',
    'Gaming laptop with dedicated RTX graphics under ₹1,00,000',
  ];

  return (
    <div className="bg-pure-white text-on-pure-white min-h-[calc(100vh-72px)]">
      <Container className="py-8 lg:py-12">
        {/* Breadcrumb Navigation */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-sm text-muted-gray mb-6">
          <Link to="/" className="hover:text-on-pure-white transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-on-pure-white font-semibold">AI Shopping Assistant</span>
        </nav>

        {/* 1. Page Header matching Google Stitch */}
        <div className="pb-6 border-b border-outline-subtle mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="max-w-3xl">
            <span className="font-label text-xs font-bold tracking-wider uppercase text-accent-orange-text">
              AI SHOPPING ASSISTANT
            </span>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-on-pure-white mt-1">
              Find the right tech. <span className="text-accent-orange-text">Just describe what you need.</span>
            </h1>
            <p className="font-body text-base sm:text-lg text-muted-gray mt-2 leading-relaxed">
              Tell PATRONET what you're looking for, and explore products matched to your workload, specifications, and budget.
            </p>
          </div>

          {messages.length > 0 && (
            <button
              type="button"
              onClick={handleClearConversation}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-muted-gray hover:text-on-pure-white hover:border-deep-black transition-colors shrink-0 self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>New Conversation</span>
            </button>
          )}
        </div>

        {/* 2. Service Error Banner */}
        {serviceError && (
          <div className="mb-8 p-4 rounded-sm border border-primary-orange bg-primary-orange-tint flex items-start justify-between gap-4" role="alert">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-accent-orange-text shrink-0 mt-0.5" />
              <div>
                <p className="font-label text-sm font-bold text-on-pure-white">Service Error</p>
                <p className="font-body text-sm text-on-pure-white mt-0.5">{serviceError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setServiceError(null)}
              className="text-xs font-semibold px-3 py-1 bg-deep-black text-on-deep-black rounded-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 3. Main Conversation & Search Container */}
        <div className="flex flex-col gap-8">
          {/* Conversational Search Input Box */}
          <section aria-label="Natural language search" className="p-5 sm:p-6 rounded-sm border border-outline-subtle bg-light-gray focus-within:border-deep-black transition-colors">
            <form onSubmit={handleFormSubmit} className="flex flex-col gap-3">
              <label htmlFor="ai-query-input" className="sr-only">
                Describe what you are looking for
              </label>
              <textarea
                id="ai-query-input"
                rows={3}
                value={inputQuery}
                onChange={(e) => {
                  setInputQuery(e.target.value);
                  if (inputError) setInputError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="I need a laptop for programming and occasional gaming under ₹80,000 with good battery life."
                className="w-full bg-pure-white border border-outline-subtle rounded-sm p-4 font-body text-base text-on-pure-white placeholder:text-muted-gray focus:outline-none focus:border-deep-black resize-none"
              />

              {inputError && (
                <p className="font-label text-xs text-accent-orange-text">{inputError}</p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <p className="font-body text-xs text-muted-gray">
                  Press Enter to send, Shift+Enter for new line · Include budget, use-case, or preferences.
                </p>

                <div className="flex items-center gap-2 shrink-0">
                  {inputQuery && (
                    <button
                      type="button"
                      onClick={() => setInputQuery('')}
                      className="px-4 py-2.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black transition-colors"
                    >
                      Clear
                    </button>
                  )}
                  <button
                    id="ai-find-btn"
                    type="submit"
                    disabled={isProcessing || !inputQuery.trim()}
                    className="px-6 py-2.5 rounded-sm bg-primary-orange text-deep-black font-label text-sm font-bold hover:bg-primary-orange-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Find Products</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {/* Suggested Prompts (Shown before or between queries) */}
            <div className="mt-4 pt-4 border-t border-outline-subtle/80 flex flex-wrap items-center gap-2">
              <span className="font-label text-xs font-semibold text-muted-gray mr-1">
                Try asking:
              </span>
              {suggestedPrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="px-3 py-1.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs text-on-pure-white hover:border-deep-black transition-colors text-left"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>

          {/* Understood Criteria Chips (Refinement Bar) */}
          {activeCriteria.length > 0 && (
            <section aria-labelledby="criteria-heading" className="p-4 rounded-sm border border-outline-subtle bg-light-gray flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span id="criteria-heading" className="font-label text-xs font-bold text-on-pure-white mr-1">
                  Understood Criteria:
                </span>
                {activeCriteria.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleRemoveCriterion(idx)}
                    title={`Remove ${chip.label}: ${chip.value}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs text-on-pure-white hover:border-deep-black transition-colors"
                  >
                    <span className="text-muted-gray">{chip.label}:</span>
                    <span className="font-semibold">{chip.value}</span>
                    <X className="w-3 h-3 text-muted-gray hover:text-deep-black" />
                  </button>
                ))}
              </div>
              <span className="font-body text-xs text-muted-gray shrink-0">
                Click any tag to refine
              </span>
            </section>
          )}

          {/* Conversation History Stream */}
          {messages.length > 0 && (
            <div className="flex flex-col gap-6 pt-4 border-t border-outline-subtle">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col gap-3 ${
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  {/* Message Bubble Header */}
                  <div className="flex items-center gap-2 text-xs text-muted-gray px-1">
                    {msg.role === 'user' ? (
                      <>
                        <span>You</span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                        <User className="w-3.5 h-3.5 text-muted-gray" />
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-primary-orange" />
                        <span className="font-semibold text-deep-black">PATRONET Assistant</span>
                        <span className="px-1.5 py-0.2 bg-primary-orange-tint text-accent-orange-text font-bold text-[10px] rounded-xs uppercase">
                          Demo Mode
                        </span>
                        <span>·</span>
                        <span>{msg.timestamp}</span>
                      </>
                    )}
                  </div>

                  {/* Message Body Bubble */}
                  <div
                    className={`max-w-3xl rounded-sm p-4 sm:p-5 font-body text-sm sm:text-base leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-deep-black text-on-deep-black rounded-tr-none'
                        : 'bg-light-gray text-on-pure-white border border-outline-subtle rounded-tl-none w-full'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Render Recommendation Product Cards (If any) */}
                    {msg.recommendations && msg.recommendations.length > 0 && (
                      <div className="mt-6 flex flex-col gap-4">
                        <div className="flex items-center justify-between pb-2 border-b border-outline-subtle">
                          <h3 className="font-headline text-base font-bold text-on-pure-white">
                            Recommended Matches ({msg.recommendations.length})
                          </h3>
                          <span className="text-xs text-muted-gray">
                            Matched against PATRONET catalogue
                          </span>
                        </div>

                        {/* Cards Grid (3 columns desktop, 1 on mobile) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
                          {msg.recommendations.map((rec) => {
                            const product = resolvedProducts[rec.productId];
                            if (!product) {
                              return (
                                <div
                                  key={rec.productId}
                                  className="p-4 rounded-sm border border-outline-subtle bg-pure-white flex items-center justify-center min-h-[220px]"
                                >
                                  <Loader2 className="w-5 h-5 animate-spin text-primary-orange" />
                                </div>
                              );
                            }

                            const imgUrl = getProductPrimaryImageUrl(product);
                            const isSavedInWishlist = isWishlisted(product.id);
                            const isProductCompared = isCompared(product.id);

                            return (
                              <article
                                key={product.id}
                                className="h-full rounded-sm border border-outline-subtle bg-pure-white flex flex-col justify-between overflow-hidden hover:border-deep-black transition-colors"
                              >
                                <div>
                                  {/* Product Thumbnail */}
                                  <Link
                                    to={`/products/${product.id}`}
                                    className="block bg-light-gray aspect-[4/3] p-4 flex items-center justify-center overflow-hidden relative group"
                                  >
                                    <img
                                      src={imgUrl}
                                      alt={product.name}
                                      onError={(e) => {
                                        (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_FALLBACK_IMAGE;
                                      }}
                                      className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-200"
                                    />
                                    {rec.matchScore && (
                                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-sm bg-deep-black text-on-deep-black font-label text-[11px] font-bold">
                                        {rec.matchScore}% match
                                      </span>
                                    )}
                                  </Link>

                                  {/* Product Info */}
                                  <div className="p-4 flex flex-col gap-3">
                                    <div>
                                      <span className="font-label text-xs uppercase tracking-wider text-muted-gray">
                                        {product.brand}
                                      </span>
                                      <Link to={`/products/${product.id}`}>
                                        <h4 className="font-title text-base font-bold text-on-pure-white hover:text-accent-orange-text transition-colors line-clamp-1 mt-0.5">
                                          {product.name}
                                        </h4>
                                      </Link>
                                      <p className="font-headline text-lg font-bold text-on-pure-white tabular-nums mt-1">
                                        ₹{product.price.toLocaleString('en-IN')}
                                      </p>
                                    </div>

                                    {/* Highlights / Reasoning List */}
                                    <ul className="flex flex-col gap-1.5 pt-2 border-t border-outline-subtle text-xs text-muted-gray">
                                      {rec.highlights?.map((hl, hIdx) => (
                                        <li key={hIdx} className="flex items-start gap-1.5">
                                          <Check className="w-3.5 h-3.5 text-accent-orange-text shrink-0 mt-0.5" />
                                          <span>{hl}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* Card Actions: Add to Cart, Wishlist, Compare */}
                                <div className="p-4 pt-0 flex flex-col gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleAddToCart(product)}
                                    className="w-full py-2.5 px-3 rounded-sm bg-deep-black text-on-deep-black font-label text-xs font-bold hover:bg-surface-dark-elevated transition-colors inline-flex items-center justify-center gap-1.5"
                                  >
                                    <ShoppingCart className="w-3.5 h-3.5" />
                                    <span>Add to Cart</span>
                                  </button>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleToggleWishlist(product)}
                                      title={isSavedInWishlist ? 'Remove from wishlist' : 'Save to wishlist'}
                                      className={`py-2 px-1.5 rounded-sm border font-label text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors ${
                                        isSavedInWishlist
                                          ? 'border-primary-orange text-accent-orange-text bg-primary-orange-tint'
                                          : 'border-outline-subtle bg-pure-white text-on-pure-white hover:border-deep-black'
                                      }`}
                                    >
                                      <Heart className={`w-3.5 h-3.5 ${isSavedInWishlist ? 'fill-primary-orange' : ''}`} />
                                      <span className="hidden sm:inline">Save</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => toggleCompareProduct(product)}
                                      title={isProductCompared ? 'Remove from compare' : 'Add to compare'}
                                      className={`py-2 px-1.5 rounded-sm border font-label text-xs font-semibold inline-flex items-center justify-center gap-1 transition-colors ${
                                        isProductCompared
                                          ? 'border-primary-orange text-accent-orange-text bg-primary-orange-tint'
                                          : 'border-outline-subtle bg-pure-white text-on-pure-white hover:border-deep-black'
                                      }`}
                                    >
                                      <Scale className="w-3.5 h-3.5" />
                                      <span className="hidden sm:inline">Compare</span>
                                    </button>

                                    <Link
                                      to={`/products/${product.id}`}
                                      className="py-2 px-1.5 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs font-semibold text-on-pure-white hover:border-deep-black text-center transition-colors inline-flex items-center justify-center"
                                    >
                                      <span>View</span>
                                    </Link>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Suggested Follow-Ups */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-outline-subtle flex flex-wrap items-center gap-2">
                        <span className="font-label text-xs font-semibold text-muted-gray">
                          Suggested follow-up:
                        </span>
                        {msg.suggestedFollowUps.map((fUp, fIdx) => (
                          <button
                            key={fIdx}
                            type="button"
                            onClick={() => handleSendMessage(fUp)}
                            className="px-2.5 py-1 rounded-sm border border-outline-subtle bg-pure-white font-label text-xs text-on-pure-white hover:border-deep-black transition-colors"
                          >
                            {fUp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* In-Flight Processing Spinner */}
              {isProcessing && (
                <div className="flex items-center gap-3 p-4 rounded-sm bg-light-gray border border-outline-subtle text-muted-gray max-w-sm">
                  <Loader2 className="w-5 h-5 animate-spin text-primary-orange shrink-0" />
                  <span className="font-body text-sm">Matching catalogue specifications...</span>
                </div>
              )}

              <div ref={conversationEndRef} />
            </div>
          )}

          {/* Empty Initial State Info when no messages exist */}
          {messages.length === 0 && (
            <section className="py-12 text-center rounded-sm border border-outline-subtle bg-light-gray flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-full bg-pure-white border border-outline-subtle flex items-center justify-center text-primary-orange">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="font-headline text-xl font-bold text-on-pure-white">
                Conversational Hardware Discovery
              </h2>
              <p className="font-body text-sm text-muted-gray max-w-md mx-auto">
                Type your workload or constraints into the field above to find tailored laptops, displays, audio gear, and peripherals.
              </p>
            </section>
          )}
        </div>
      </Container>
    </div>
  );
};

export default AIShoppingPage;
