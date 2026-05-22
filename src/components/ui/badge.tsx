import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-brand-purple text-white",
        secondary: "border-transparent bg-ink-700 text-ink-300",
        destructive: "border-transparent bg-danger text-white",
        outline: "border-brand-purple text-brand-purple",
        success: "border-transparent bg-success text-white",
        warning: "border-transparent bg-warning text-ink-900",
        pink: "border-transparent bg-brand-pink text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
