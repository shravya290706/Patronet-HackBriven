import * as React from "react";
import { Link } from "react-router-dom";

export interface CategoryTileProps {
  to: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  imageAlt: string;
  aspectClass?: string;
  className?: string;
  isLargeTitle?: boolean;
}

export const CategoryTile: React.FC<CategoryTileProps> = ({
  to,
  title,
  subtitle,
  imageUrl,
  imageAlt,
  aspectClass = "aspect-[16/10]",
  className = "",
  isLargeTitle = false,
}) => {
  const [hasError, setHasError] = React.useState<boolean>(false);
  const [prevImageUrl, setPrevImageUrl] = React.useState<string>(imageUrl);

  // Derived state adjustment pattern recommended by React docs for props change:
  if (imageUrl !== prevImageUrl) {
    setPrevImageUrl(imageUrl);
    setHasError(false);
  }

  const handleError = () => {
    setHasError(true);
  };

  const currentSrc = hasError ? "/images/products/placeholder.svg" : imageUrl;

  return (
    <Link to={to} className={`group flex flex-col gap-2 ${className}`}>
      <div className={`${aspectClass} w-full bg-light-gray rounded-sm overflow-hidden flex items-center justify-center`}>
        <img
          src={currentSrc}
          alt={imageAlt}
          onError={handleError}
          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
          loading="lazy"
        />
      </div>
      <div className="flex items-baseline justify-between pt-1">
        <h3
          className={`font-headline ${
            isLargeTitle ? "text-xl md:text-2xl font-bold" : "text-lg font-semibold"
          } text-on-pure-white group-hover:text-accent-orange-text transition-colors duration-150`}
        >
          {title}
        </h3>
        <span className="font-body text-sm text-muted-gray">{subtitle}</span>
      </div>
    </Link>
  );
};
