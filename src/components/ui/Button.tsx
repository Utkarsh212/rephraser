import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit" | "reset";
};

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    "bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-stone-50 border border-stone-900 shadow-sm",
  secondary:
    "bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 border border-stone-300",
  ghost:
    "bg-transparent hover:bg-stone-200/60 active:bg-stone-200 text-stone-700 border border-transparent",
  danger:
    "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white border border-red-600 shadow-sm",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs gap-1",
  md: "px-4 py-2 text-sm gap-1.5",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  className = "",
  disabled,
  type = "button",
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/50 focus-visible:ring-offset-1 focus-visible:ring-offset-stone-50 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      {children}
    </button>
  );
}
