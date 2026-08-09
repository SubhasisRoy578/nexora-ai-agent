import { Hexagon, User, Copy, RefreshCw, ThumbsUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { TOOL_META } from "./tool-config"
import type { ChatMessage } from "@/lib/nexora-data"

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3 sm:gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg",
          isUser
            ? "bg-secondary text-foreground"
            : "bg-primary/15 text-primary glow-ring",
        )}
      >
        {isUser ? <User className="size-4" /> : <Hexagon className="size-4" strokeWidth={2.5} />}
      </div>

      <div className={cn("flex min-w-0 max-w-[88%] flex-col gap-1.5 sm:max-w-[78%]", isUser && "items-end")}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground">
            {isUser ? "You" : "Nexora Agent"}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">{message.timestamp}</span>
        </div>

        {message.tools && message.tools.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.tools.map((t) => {
              const meta = TOOL_META[t]
              const Icon = meta.icon
              return (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                >
                  <Icon className="size-3" />
                  {meta.label}
                </span>
              )
            })}
          </div>
        )}

        <div
          className={cn(
            "rounded-2xl border px-4 py-3 text-[13px] leading-relaxed",
            isUser
              ? "rounded-tr-sm border-primary/30 bg-primary/12 text-foreground"
              : "rounded-tl-sm border-border bg-card text-card-foreground",
          )}
        >
          {message.content.split("\n").map((line, i) =>
            line.trim() === "" ? (
              <span key={i} className="block h-2" />
            ) : (
              <p key={i} className={cn(i > 0 && "mt-1")}>
                {line}
              </p>
            ),
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1 pl-1">
            {[
              { icon: Copy, label: "Copy" },
              { icon: RefreshCw, label: "Regenerate" },
              { icon: ThumbsUp, label: "Helpful" },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                aria-label={label}
                className="grid size-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Icon className="size-3.5" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
