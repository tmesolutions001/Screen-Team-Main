import type { HTMLAttributes } from "react"

import { cn } from "@/lib/utils"

interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** 0–100 */
  value: number
}

/** Accent progress bar. Moves on transform with a linear 1s glide, so per-second updates read as continuous. */
export const Progress = ({ value, className, ...props }: ProgressProps) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={100}
    aria-valuenow={Math.round(value)}
    className={cn("relative h-4 w-full overflow-hidden rounded-full", className)}
    {...props}
  >
    <div
      className="h-full w-full rounded-full transition-transform duration-1000 ease-linear"
      style={{ background: "var(--gradient-accent)", transform: `translateX(-${100 - value}%)` }}
    />
  </div>
)
