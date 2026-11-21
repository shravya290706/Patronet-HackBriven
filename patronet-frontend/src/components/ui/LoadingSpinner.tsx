import * as React from "react";
import { cn } from "@/lib/utils";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  label = 'Loading...',
  className,
  ...props
}) => {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-3",
  };

  return (
    <div
      role="status"
      aria-label={label}
      className={cn("flex flex-col items-center justify-center gap-3 p-4", className)}
      {...props}
    >
      <div
        className={cn(
          "animate-spin rounded-full border-outline-subtle border-t-primary-orange",
          sizeClasses[size]
        )}
      />
      {label && <span className="font-label text-label-sm text-muted-gray">{label}</span>}
    </div>
  );
};
