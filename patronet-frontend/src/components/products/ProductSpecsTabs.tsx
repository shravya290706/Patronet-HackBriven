import * as React from "react";
import type { Product } from "@/types";

export interface ProductSpecsTabsProps {
  product: Product;
}

export const ProductSpecsTabs: React.FC<ProductSpecsTabsProps> = ({ product }) => {
  const [activeTab, setActiveTab] = React.useState<"overview" | "specifications" | "availability">("specifications");

  const specsEntries = React.useMemo(() => {
    if (!product.specifications || typeof product.specifications !== "object") {
      return [];
    }
    return Object.entries(product.specifications);
  }, [product.specifications]);

  const inventorySummary = React.useMemo(() => {
    if (product.inventory && product.inventory.length > 0) {
      const totalStock = product.inventory.reduce((sum, item) => sum + (item.quantityOnHand || 0), 0);
      const minLeadTime = Math.min(...product.inventory.map((item) => item.leadTimeDays || 2));
      const hubNames = product.inventory.map((item) => item.storeName).join(", ");
      return { totalStock, minLeadTime, hubNames };
    }
    return {
      totalStock: 50,
      minLeadTime: 2,
      hubNames: "Mumbai, Bengaluru, and Delhi-NCR fulfillment hubs",
    };
  }, [product.inventory]);

  return (
    <section className="pb-16 pt-8 border-t border-outline-subtle mt-12">
      {/* Tab Navigation List */}
      <div
        className="border-b border-outline-subtle flex items-center gap-8 mb-8"
        role="tablist"
        aria-label="Product information"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
          className={`pb-4 font-label text-base font-medium transition-colors duration-150 border-b-2 cursor-pointer ${
            activeTab === "overview"
              ? "text-deep-black border-deep-black font-semibold"
              : "text-muted-gray border-transparent hover:text-deep-black"
          }`}
        >
          Overview
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "specifications"}
          onClick={() => setActiveTab("specifications")}
          className={`pb-4 font-label text-base font-medium transition-colors duration-150 border-b-2 cursor-pointer ${
            activeTab === "specifications"
              ? "text-deep-black border-deep-black font-semibold"
              : "text-muted-gray border-transparent hover:text-deep-black"
          }`}
        >
          Specifications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "availability"}
          onClick={() => setActiveTab("availability")}
          className={`pb-4 font-label text-base font-medium transition-colors duration-150 border-b-2 cursor-pointer ${
            activeTab === "availability"
              ? "text-deep-black border-deep-black font-semibold"
              : "text-muted-gray border-transparent hover:text-deep-black"
          }`}
        >
          Availability
        </button>
      </div>

      {/* Tab Panel: Overview */}
      {activeTab === "overview" && (
        <div id="tab-overview" role="tabpanel" className="max-w-3xl flex flex-col gap-4 animate-fade-in">
          <h2 className="font-headline text-2xl font-bold text-deep-black">
            {product.name} — Engineered for Performance
          </h2>
          <p className="font-body text-base text-muted-gray leading-relaxed">
            {product.description ||
              "Experience precision-crafted electronics built to the highest standards. Delivering uncompromising performance, superior battery efficiency, and refined aesthetics."}
          </p>
          {product.shortDescription && (
            <p className="font-body text-sm text-muted-gray/90 italic">
              Key Highlights: {product.shortDescription}
            </p>
          )}
        </div>
      )}

      {/* Tab Panel: Specifications */}
      {activeTab === "specifications" && (
        <div id="tab-specifications" role="tabpanel" className="animate-fade-in">
          {specsEntries.length > 0 ? (
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-12 divide-y divide-outline-subtle border-y border-outline-subtle">
              {specsEntries.map(([key, val]) => (
                <div key={key} className="py-4 flex items-baseline justify-between gap-4">
                  <dt className="font-label text-sm text-muted-gray">{key}</dt>
                  <dd className="font-body text-sm font-medium text-deep-black text-right">
                    {typeof val === "object" ? JSON.stringify(val) : String(val)}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="py-8 text-center text-muted-gray text-sm">
              Standard hardware specifications apply. Inquire with support for deep telemetry.
            </div>
          )}
        </div>
      )}

      {/* Tab Panel: Availability */}
      {activeTab === "availability" && (
        <div id="tab-availability" role="tabpanel" className="max-w-3xl flex flex-col gap-3 animate-fade-in">
          <h2 className="font-headline text-xl font-bold text-deep-black">
            Ready for immediate dispatch across India.
          </h2>
          <p className="font-body text-base text-muted-gray leading-relaxed">
            Fulfilled via {inventorySummary.hubNames}. Standard express insured delivery within{" "}
            {inventorySummary.minLeadTime}–4 business days across India, backed by comprehensive PATRONET warranty coverage.
          </p>
          {product.inventory && product.inventory.length > 0 && (
            <div className="mt-4 border border-outline-subtle rounded-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-light-gray text-xs font-label uppercase text-muted-gray border-b border-outline-subtle">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Distribution Hub</th>
                    <th className="py-2.5 px-4 font-semibold">Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Est. Delivery</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-subtle font-body">
                  {product.inventory.map((inv, idx) => (
                    <tr key={idx} className="hover:bg-light-gray/50 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-deep-black">{inv.storeName}</td>
                      <td className="py-2.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-accent-orange-text font-medium text-xs">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-orange-text"></span>
                          In stock ({inv.quantityOnHand} units)
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right text-muted-gray text-xs">
                        {inv.leadTimeDays} business days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
