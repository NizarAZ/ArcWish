import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      "flex h-11 w-full rounded-md border border-moss/25 bg-paper px-3 py-2 text-sm text-moss shadow-sm transition-colors placeholder:text-moss/45 focus-visible:border-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard/70 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
