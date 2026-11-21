import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <div
          className={cn(
            "relative flex items-center bg-light-gray border border-outline-subtle rounded-sm transition-colors duration-150",
            "focus-within:border-deep-black focus-within:ring-1 focus-within:ring-deep-black",
            error && "border-red-600 focus-within:border-red-600 focus-within:ring-red-600",
            disabled && "opacity-50 cursor-not-allowed bg-outline-subtle/30"
          )}
        >
          {leftIcon && (
            <div className="pl-3.5 flex items-center justify-center text-muted-gray pointer-events-none shrink-0">
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full bg-transparent px-3.5 py-2 font-body text-body-md text-on-pure-white placeholder:text-muted-gray focus:outline-none disabled:cursor-not-allowed",
              leftIcon && "pl-2",
              rightIcon && "pr-2",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="pr-3.5 flex items-center justify-center text-muted-gray shrink-0">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 font-body text-label-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
