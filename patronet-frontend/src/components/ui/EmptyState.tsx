import * as React from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 md:p-12 text-center border border-dashed border-outline-subtle rounded-sm bg-pure-white",
        className
      )}
    >
      {icon && <div className="mb-4 text-muted-gray">{icon}</div>}
      <h3 className="font-headline text-title-lg text-on-pure-white">{title}</h3>
      {description && (
        <p className="mt-1.5 font-body text-body-md text-muted-gray max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
