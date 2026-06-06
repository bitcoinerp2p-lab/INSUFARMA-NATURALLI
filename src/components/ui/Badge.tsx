import { type ReactNode } from "react";
import { clsx } from "clsx";

export type BadgeVariant = "default" | "success" | "warning" | "danger" | "gold";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-gray-100 text-gray-700 border-gray-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger:  "bg-red-50 text-brand-red border-red-200",
  gold:    "bg-brand-gold/10 text-brand-gold-dark border-brand-gold/30",
};

const sizeClasses = {
  sm: "text-[11px] px-2 py-0.5 font-medium",
  md: "text-xs px-2.5 py-1 font-semibold",
};

export default function Badge({
  children,
  variant = "default",
  size = "md",
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full border leading-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}
