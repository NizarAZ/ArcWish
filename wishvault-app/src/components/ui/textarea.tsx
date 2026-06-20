import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-32 w-full resize-y rounded-md border border-moss/25 bg-paper px-3 py-2 text-sm leading-6 text-moss shadow-sm transition-colors placeholder:text-moss/45 focus-visible:border-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard/70 disabled:cursor-not-allowed disabled:opacity-60",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export { Textarea };
