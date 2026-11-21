import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { CategoryTile } from "./CategoryTile";
import { categoryService, type CategoryItem } from "@/services/api/categoryService";

export const CategoryGrid: React.FC = () => {
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    categoryService
      .getCategories()
      .then((cats) => {
        if (active) {
          setCategories(cats);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="popular-categories" className="space-y-space-md">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold tracking-tight">
            Popular Categories
          </h2>
          <p className="font-body-sm text-body-sm text-outline mt-0.5">
            Curated marketplace sectors
          </p>
        </div>
        <Link
          to="/products"
          className="flex items-center gap-space-xs font-label-md text-label-md text-primary font-bold hover:text-secondary-container transition-colors cursor-pointer"
        >
          <span>View All Categories</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Categories Grid (6 per row on large screens) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-space-md">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-container-low rounded-xl h-52 animate-pulse"
              />
            ))
          : categories.map((cat) => (
              <CategoryTile
                key={cat.id}
                id={cat.id}
                name={cat.name}
                description={cat.description}
                imageUrl={cat.imageUrl}
              />
            ))}
      </div>
    </section>
  );
};
