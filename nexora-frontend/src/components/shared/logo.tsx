import { Hexagon } from "lucide-react"
import { cn } from "@/lib/utils"

export function NexoraLogo({
  className,
  showWordmark = true,
}: {
  className?: string
  showWordmark?: boolean
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative grid size-8 shrink-0 place-items-center rounded-md bg-primary/15 glow-ring">
        <Hexagon className="size-4 text-primary" strokeWidth={2.5} />
        <span className="absolute size-1.5 rounded-full bg-primary" />
      </div>
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Nexora<span className="text-primary"> AI</span>
          </span>
          <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Command Center
          </span>
        </div>
      )}
    </div>
  )
}
