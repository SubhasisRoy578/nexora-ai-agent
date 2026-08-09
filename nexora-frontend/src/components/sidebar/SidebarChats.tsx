"use client";

import { MessageSquare } from "lucide-react";

const chats = [
  "AI Automation Project",
  "Machine Learning Notes",
  "Frontend Design Ideas",
  "Python Debugging",
  "AI Agent Architecture",
  "LLM Routing System",
  "FastAPI Backend",
  "Next.js Planning",
];

export default function SidebarChats() {
  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <h2 className="text-xs uppercase tracking-wider text-zinc-500 px-3 mb-3">
        Recent Chats
      </h2>

      <div className="space-y-1">
        {chats.map((chat, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm transition-all text-left
              
              ${
                index === 0
                  ? "bg-[#2a2a2a]"
                  : "hover:bg-[#232323]"
              }
            `}
          >
            <MessageSquare size={18} />

            <span className="truncate">
              {chat}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}