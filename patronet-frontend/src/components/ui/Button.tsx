import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-label text-label-md font-medium transition-colors duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variants = {
      primary: "bg-primary-orange text-deep-black hover:bg-primary-orange-hover active:bg-primary-orange-hover rounded-sm font-semibold",
      secondary: "bg-deep-black text-on-deep-black hover:bg-surface-dark-elevated rounded-sm font-semibold",
      outline: "border border-outline-subtle bg-pure-white text-on-pure-white hover:bg-light-gray hover:border-deep-black rounded-sm",
      ghost: "text-on-pure-white hover:bg-light-gray hover:text-deep-black rounded-sm",
      icon: "text-on-pure-white hover:text-muted-gray rounded-full w-9 h-9 p-0",
    };

    const sizes = {
      sm: "h-8 px-3 text-label-sm",
      md: "h-10 px-4 text-label-md",
      lg: "h-12 px-6 text-label-lg",
      icon: "w-9 h-9 p-0",
    };

    const isIconOnly = variant === 'icon' || size === 'icon';

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variants[variant],
          !isIconOnly && sizes[size],
          isIconOnly && "w-9 h-9 p-0",
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            {!isIconOnly && children}
          </span>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";
