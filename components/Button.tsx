import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonStyles = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-70",
  {
    variants: {
      intent: {
        primary:
          "bg-[#002855] text-[#f7f3e8] hover:bg-[#004a98] focus-visible:outline-[#eaaa00]",
        secondary:
          "border border-[#eaaa00]/40 bg-slate-900 text-[#f7d77c] hover:border-[#eaaa00]/70 hover:text-[#ffe7a6] focus-visible:outline-[#eaaa00]",
        subtle:
          "bg-slate-800/80 text-slate-100 hover:bg-slate-700/60 focus-visible:outline-slate-300",
        ghost: "text-[#d2dce8] hover:text-[#ffd76a]",
      },
      size: {
        sm: "px-3 py-1.5",
        md: "px-4 py-2",
        lg: "px-5 py-2.5 text-base",
      },
    },
    defaultVariants: {
      intent: "primary",
      size: "md",
    },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonStyles>;

export function Button({ className, intent, size, ...props }: ButtonProps) {
  return <button className={cn(buttonStyles({ intent, size }), className)} {...props} />;
}
