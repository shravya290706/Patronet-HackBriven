import * as React from "react";
import { Link } from "react-router-dom";
import { Handshake } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { NegotiationModal } from "@/components/negotiation/NegotiationModal";
import { productService } from "@/services";
import type { Product } from "@/types";

export const ProcurementPage: React.FC = () => {
  const [demoProducts, setDemoProducts] = React.useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [isNegotiating, setIsNegotiating] = React.useState(false);

  React.useEffect(() => {
    productService
      .getProducts({ pageSize: 4 })
      .then((res) => {
        if (Array.isArray(res)) setDemoProducts(res.slice(0, 4));
      })
      .catch(() => {});
  }, []);

  const handleLaunchNegotiate = (product: Product) => {
    setSelectedProduct(product);
    setIsNegotiating(true);
  };

  return (
    <Container className="py-8">
      <PageHeader
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Negotiator & B2B Procurement" }]}
        badge="USP 2: Smart Price Negotiation"
        title="Price Negotiator &amp; Enterprise Procurement"
        description="Experience conversational price negotiation with real-time algorithmic counteroffers and wholesale discount approval."
      />

      {/* Live Negotiator Interactive Showcase */}
      <div className="mb-10 bg-gradient-to-r from-amber-500/15 via-surface-container-low to-surface-container-lowest border border-amber-300 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-900 rounded-xl border border-amber-300">
              <Handshake className="w-6 h-6 text-amber-800" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface">
                  Try Negotiator Bargain Studio
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/30 text-amber-950 font-bold text-[10px] uppercase">
                  Live Interactive Demo
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant">
                Select any hardware item below to make a custom offer. The engine will accept, counter, or provide pricing reasoning.
              </p>
            </div>
          </div>
        </div>

        {demoProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
            {demoProducts.map((p) => (
              <div
                key={p.id}
                className="bg-surface-container-lowest border border-surface-container rounded-xl p-3 flex flex-col justify-between shadow-2xs hover:border-amber-400 transition-colors"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-gray block">
                    {p.brand}
                  </span>
                  <p className="font-semibold text-xs text-on-surface line-clamp-1">
                    {p.name}
                  </p>
                  <p className="text-sm font-bold text-primary tabular-nums mt-1">
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleLaunchNegotiate(p)}
                  className="mt-3 w-full py-1.5 px-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Handshake className="w-3.5 h-3.5 text-amber-800" />
                  <span>Negotiate Price</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RFQ Procurement Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <form onSubmit={(e) => e.preventDefault()} className="lg:col-span-8 space-y-4 border border-outline-subtle p-6 rounded-xl bg-surface-container-lowest shadow-xs">
          <h3 className="font-headline text-base font-bold text-on-surface border-b border-surface-container pb-2">
            B2B Custom Quotation &amp; Fleet RFQ
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Company Name</label>
              <Input placeholder="Acme Technologies Pvt Ltd" />
            </div>
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">GSTIN Number</label>
              <Input placeholder="29AAAAA0000A1Z5" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Hardware Category</label>
              <Input placeholder="Developer Laptops (e.g. 32GB RAM)" />
            </div>
            <div>
              <label className="block font-label text-label-sm font-semibold mb-1">Quantity (Units)</label>
              <Input type="number" placeholder="25" />
            </div>
          </div>
          <div>
            <label className="block font-label text-label-sm font-semibold mb-1">Specific Requirements &amp; Timelines</label>
            <Textarea placeholder="Detail configuration requirements, operating system image needs, or targeted delivery milestones..." />
          </div>
          <div className="pt-2 flex items-center justify-between">
            <Link to="/procurement/PN-BULK-2026-4108/progress">
              <Button variant="primary">Submit RFQ Request</Button>
            </Link>
            <Link to="/procurement/PN-BULK-2026-4108/offers" className="text-sm text-primary hover:underline font-semibold">
              View Active RFQ (Sample) &rarr;
            </Link>
          </div>
        </form>

        <div className="lg:col-span-4 p-6 border border-outline-subtle rounded-xl bg-surface-container-low space-y-3">
          <h4 className="font-headline text-title-md font-bold">Why negotiate &amp; procure on PATRONET?</h4>
          <ul className="space-y-2 font-body text-body-md text-muted-gray">
            <li>&bull; Instant algorithmic counteroffers based on wholesale margin.</li>
            <li>&bull; Verified OEM tier-1 authorized distributors.</li>
            <li>&bull; Transparent limit-based bargaining with server-side price locks.</li>
            <li>&bull; Add negotiated deals straight to your shopping cart.</li>
            <li>&bull; Input tax credit (ITC) compliant invoicing across India.</li>
          </ul>
        </div>
      </div>

      {selectedProduct && (
        <NegotiationModal
          product={selectedProduct}
          isOpen={isNegotiating}
          onClose={() => setIsNegotiating(false)}
        />
      )}
    </Container>
  );
};
