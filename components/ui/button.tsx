import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 select-none cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--brand-primary)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--brand-secondary)] hover:shadow-[0_0_20px_var(--brand-glow)] active:scale-[0.98]",
        primary:
          "bg-[var(--brand-primary)] text-white rounded-[var(--radius-md)] font-semibold hover:bg-[var(--brand-secondary)] hover:shadow-[0_0_20px_var(--brand-glow)] active:scale-[0.98]",
        ghost:
          "bg-transparent border border-[var(--border-base)] text-[var(--text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.98]",
        outline:
          "bg-transparent border border-[var(--border-base)] text-[var(--text-secondary)] rounded-[var(--radius-md)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] active:scale-[0.98]",
        secondary:
          "bg-[var(--bg-elevated)] border border-[var(--border-base)] text-[var(--text-primary)] rounded-[var(--radius-md)] hover:border-[var(--border-strong)] active:scale-[0.98]",
        destructive:
          "bg-[var(--red)]/20 border border-[var(--red)]/30 text-[var(--red)] rounded-[var(--radius-md)] hover:bg-[var(--red)]/30 active:scale-[0.98]",
        link: "text-[var(--brand-secondary)] underline-offset-4 hover:underline",
        icon: "w-8 h-8 min-w-[32px] p-0 bg-[var(--bg-elevated)] border border-[var(--border-base)] rounded-[var(--radius-sm)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]",
      },
      size: {
        default: "h-10 px-5 py-2.5 text-sm",
        sm: "h-8 px-3.5 py-1.5 text-xs rounded-[var(--radius-sm)]",
        lg: "h-11 px-6 py-3 text-base rounded-[var(--radius-md)]",
        icon: "w-8 h-8 min-w-[32px] p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
