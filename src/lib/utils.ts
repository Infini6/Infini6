import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(timeStr?: string): string {
  if (!timeStr) return "--:--";
  if (timeStr.includes("T")) {
    const d = new Date(timeStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return timeStr;
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
