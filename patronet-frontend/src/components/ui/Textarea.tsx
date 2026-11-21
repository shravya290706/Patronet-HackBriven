import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full">
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            "flex min-h-[96px] w-full rounded-sm border border-outline-subtle bg-light-gray px-3.5 py-2.5 font-body text-body-md text-on-pure-white placeholder:text-muted-gray transition-colors duration-150",
            "focus:border-deep-black focus:outline-none focus:ring-1 focus:ring-deep-black",
            error && "border-red-600 focus:border-red-600 focus:ring-red-600",
            disabled && "opacity-50 cursor-not-allowed bg-outline-subtle/30",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 font-body text-label-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";
