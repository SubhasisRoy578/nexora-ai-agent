import { Database, Globe, Code2, Bot, Paperclip, type LucideIcon } from "lucide-react"
import type { ToolId } from "@/lib/nexora-data"

export interface ToolMeta {
  label: string
  icon: LucideIcon
  description: string
}

export const TOOL_META: Record<ToolId, ToolMeta> = {
  rag: { label: "RAG", icon: Database, description: "Retrieve from knowledge base" },
  search: { label: "Search", icon: Globe, description: "Live web search" },
  code: { label: "Code", icon: Code2, description: "Code interpreter" },
  agent: { label: "Agent", icon: Bot, description: "Autonomous multi-step agent" },
  upload: { label: "Upload", icon: Paperclip, description: "Attach files" },
}

export const TOOL_ORDER: ToolId[] = ["rag", "search", "code", "agent", "upload"]
