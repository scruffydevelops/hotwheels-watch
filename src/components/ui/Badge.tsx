import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

function Badge({ className, selected, ...props }: BadgeProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex items-center rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 cursor-pointer",
        selected
          ? "border-transparent text-white shadow bg-gradient-brand hover:opacity-90"
          : "border-slate-200 bg-transparent text-slate-900 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  )
}

export { Badge }
