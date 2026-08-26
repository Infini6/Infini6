import React, { useState } from "react";
import { Loader2 } from "lucide-react";

interface DoubleActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onAction: () => Promise<void> | void;
  loadingText?: string;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning" | "outline";
  size?: "sm" | "md" | "lg";
}

export const DoubleActionButton: React.FC<DoubleActionButtonProps> = ({
  children,
  onAction,
  loadingText = "Processing...",
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isProcessing || disabled) return;

    setIsProcessing(true);
    try {
      await onAction();
    } finally {
      // Small cooldown to ensure backend state catches up and prevents multi-click race conditions
      setTimeout(() => {
        setIsProcessing(false);
      }, 400);
    }
  };

  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-hidden focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-xs font-semibold gap-2",
    lg: "px-5 py-2.5 text-sm gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-200/50 focus:ring-indigo-500",
    secondary:
      "bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 focus:ring-slate-400",
    success:
      "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-sm shadow-emerald-200/50 focus:ring-emerald-500",
    danger:
      "bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-200/50 focus:ring-rose-500",
    warning:
      "bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-sm shadow-amber-200/50 focus:ring-amber-500",
    outline:
      "border border-slate-200/90 bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 shadow-2xs focus:ring-slate-300",
  };

  return (
    <button
      {...props}
      disabled={disabled || isProcessing}
      onClick={handleClick}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {isProcessing ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
