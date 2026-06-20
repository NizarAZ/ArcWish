import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    type="range"
    className={cn("h-2 w-full cursor-pointer accent-vine focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mustard", className)}
    {...props}
  />
));
Slider.displayName = "Slider";

export { Slider };
