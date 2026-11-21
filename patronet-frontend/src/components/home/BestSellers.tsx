import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { ProductCard } from "../products/ProductCard";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/types";

export interface BestSellersProps {
  products: Product[];
}

export const BestSellers: React.FC<BestSellersProps> = ({ products }) => {
  const { addItem: addCartItem } = useCart();
  const [compareIds, setCompareIds] = React.useState<Set<string>>(new Set());

  const productList = Array.isArray(products) ? products : [];

  const handleToggleCompare = (product: Product) => {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(product.id)) {
        next.delete(product.id);
      } else {
        next.add(product.id);
      }
      return next;
    });
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await addCartItem(product.id, 1);
      toast.success(`Added 1 × ${product.name} to cart.`);
    } catch {
      toast.error(`Failed to add ${product.name} to cart.`);
    }
  };

  return (
    <section id="bestsellers" className="max-w-[1360px] mx-auto px-4 md:px-6 xl:px-12 pb-12 lg:pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-outline-subtle mb-8">
        <div>
          <h2 className="font-headline text-2xl md:text-3xl font-bold text-on-pure-white">
            Best sellers.
          </h2>
          <p className="font-body text-sm md:text-base text-muted-gray mt-1">
            In-stock hardware ready for pan-India dispatch.
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1 font-label text-base font-semibold text-on-pure-white hover:text-accent-orange-text transition-colors duration-150 shrink-0"
        >
          <span>Shop all products</span>
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* 4-Column Structured Retail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
        {productList.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isCompared={compareIds.has(product.id)}
            onToggleCompare={handleToggleCompare}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </section>
  );
};
