import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { resolveCategoryImageUrl } from "@/lib/productImageCatalog";

export interface CategoryTileProps {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  name,
  description,
  imageUrl,
}) => {
  const finalImageUrl = imageUrl || resolveCategoryImageUrl(name);

  return (
    <Link
      to={`/products?category=${encodeURIComponent(name.toLowerCase())}`}
      className="group relative bg-[#F0F4FA] rounded-xl p-space-md overflow-hidden transition-all duration-300 hover:-translate-y-1 shadow-sm flex flex-col justify-between h-52 border border-surface-container/60 cursor-pointer"
    >
      {/* Category Name & Short Description */}
      <div className="flex items-start justify-between relative z-10">
        <div>
          <h3 className="font-title-md text-title-md font-bold text-primary group-hover:text-secondary-container transition-colors">
            {name}
          </h3>
          {description && (
            <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1 mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>

      {/* Category Photography (Square Plinth at Bottom Right) */}
      <div className="w-28 h-28 self-end -mr-2 -mb-2 rounded-lg overflow-hidden flex items-center justify-center bg-surface-container-lowest/50">
        <img
          src={finalImageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg"
          loading="lazy"
        />
      </div>

      {/* Explore Link at Bottom */}
      <div className="relative z-10 flex items-center gap-1 font-label-sm text-label-sm text-primary font-bold group-hover:text-secondary-container transition-colors pt-2">
        <span>Explore</span>
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
};
