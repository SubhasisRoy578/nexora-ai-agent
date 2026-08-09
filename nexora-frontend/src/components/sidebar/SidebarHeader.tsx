"use client";

import {
  Plus,
  Search,
} from "lucide-react";

export default function SidebarHeader() {
  return (
    <div className="p-4 border-b border-zinc-800">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-white text-black flex items-center justify-center font-bold">
          N
        </div>

        <div>
          <h1 className="font-semibold text-lg">
            Nexora AI
          </h1>

          <p className="text-xs text-zinc-400">
            AI Agent Platform
          </p>
        </div>
      </div>

      {/* New Chat */}
      <button className="w-full bg-white text-black rounded-xl py-3 flex items-center justify-center gap-2 font-medium hover:opacity-90 transition">
        <Plus size={18} />
        New Chat
      </button>

      {/* Search */}
      <div className="mt-4 relative">
        <Search
          className="absolute left-3 top-3 text-zinc-500"
          size={18}
        />

        <input
          type="text"
          placeholder="Search chats..."
          className="w-full bg-[#222222] border border-zinc-700 rounded-xl py-3 pl-10 pr-4 outline-none focus:border-zinc-500 text-sm"
        />
      </div>
    </div>
  );
}