import React from "react";
import { cn } from "@/shared/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "link";
  size?: "sm" | "md" | "lg" | "icon";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 disabled:pointer-events-none disabled:opacity-50 select-none";

    const variants = {
      primary: "bg-zinc-900 text-white hover:bg-zinc-800 active:bg-zinc-950 shadow-sm",
      secondary: "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 active:bg-zinc-100 shadow-sm",
      outline: "border border-zinc-300 text-zinc-800 bg-transparent hover:bg-zinc-100",
      ghost: "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200",
      danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
      link: "text-zinc-900 underline-offset-4 hover:underline p-0 h-auto",
    };

    const sizes = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5",
      md: "h-9 px-4 text-sm rounded-md gap-2",
      lg: "h-10 px-5 text-base rounded-md gap-2",
      icon: "h-8 w-8 rounded-md p-0",
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
