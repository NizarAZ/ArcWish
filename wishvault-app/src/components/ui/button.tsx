import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard focus-visible:ring-offset-2 focus-visible:ring-offset-glasshouse disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-55",
  {
    variants: {
      variant: {
        primary: "border-clay bg-clay text-paper hover:bg-[#9d4726]",
        secondary: "border-moss bg-transparent text-moss hover:bg-moss hover:text-paper",
        vine: "border-vine bg-vine text-paper hover:bg-[#4f7a4e]",
        ghost: "border-transparent bg-transparent text-moss hover:bg-paper",
        quiet: "border-border bg-paper text-moss hover:border-moss"
      },
      size: {
        sm: "min-h-9 px-3 text-xs",
        default: "min-h-10 px-4",
        lg: "min-h-11 px-5",
        icon: "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
