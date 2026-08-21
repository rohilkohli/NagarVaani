import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center px-2 py-0.5 text-[11px] font-medium uppercase tracking-[0.06em] leading-normal rounded-[4px] border transition-colors select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[rgba(99,102,241,0.12)] text-[var(--brand-secondary)] border-[rgba(99,102,241,0.25)]",
        brand:
          "bg-[rgba(99,102,241,0.12)] text-[var(--brand-secondary)] border-[rgba(99,102,241,0.25)]",
        secondary:
          "bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border-base)]",
        outline:
          "bg-transparent text-[var(--text-secondary)] border-[var(--border-base)]",
        destructive:
          "bg-[rgba(239,68,68,0.12)] text-[var(--red)] border-[rgba(239,68,68,0.25)]",
        success:
          "bg-[rgba(34,197,94,0.12)] text-[var(--green)] border-[rgba(34,197,94,0.25)]",
        warning:
          "bg-[rgba(245,158,11,0.12)] text-[var(--amber)] border-[rgba(245,158,11,0.25)]",
        info:
          "bg-[rgba(56,189,248,0.12)] text-[var(--cat-water)] border-[rgba(56,189,248,0.25)]",
        // Category tags
        roads:
          "bg-[rgba(249,115,22,0.12)] text-[var(--cat-roads)] border-[rgba(249,115,22,0.25)]",
        water:
          "bg-[rgba(56,189,248,0.12)] text-[var(--cat-water)] border-[rgba(56,189,248,0.25)]",
        electricity:
          "bg-[rgba(251,191,36,0.12)] text-[var(--cat-electricity)] border-[rgba(251,191,36,0.25)]",
        sanitation:
          "bg-[rgba(168,85,247,0.12)] text-[var(--cat-sanitation)] border-[rgba(168,85,247,0.25)]",
        health:
          "bg-[rgba(244,63,94,0.12)] text-[var(--cat-health)] border-[rgba(244,63,94,0.25)]",
        education:
          "bg-[rgba(52,211,153,0.12)] text-[var(--cat-education)] border-[rgba(52,211,153,0.25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "brand"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | "roads"
    | "water"
    | "electricity"
    | "sanitation"
    | "health"
    | "education";
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

function Badge({ className, variant = "default", style, ...props }: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant }), className)}
      style={style}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
