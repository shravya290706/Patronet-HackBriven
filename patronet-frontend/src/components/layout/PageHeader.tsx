import * as React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface PageHeaderProps {
  breadcrumbs?: Array<{ label: string; href?: string }>;
  badge?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumbs,
  badge,
  title,
  description,
  actions,
  className,
}) => {
  return (
    <div className={cn("pb-6 border-b border-outline-subtle mb-8", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label text-label-md text-muted-gray mb-3">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {item.href && !isLast ? (
                  <Link
                    to={item.href}
                    className="hover:text-on-pure-white transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className={isLast ? "text-on-pure-white font-medium" : ""}>
                    {item.label}
                  </span>
                )}
                {!isLast && <span aria-hidden="true" className="text-outline-subtle">/</span>}
              </React.Fragment>
            );
          })}
        </nav>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          {badge && (
            <span className="font-label text-label-sm tracking-wider uppercase text-accent-orange-text font-semibold">
              {badge}
            </span>
          )}
          <h1 className="font-headline text-2xl md:text-3xl font-bold tracking-tight text-on-pure-white">
            {title}
          </h1>
          {description && (
            <p className="font-body text-body-md text-muted-gray max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
};
