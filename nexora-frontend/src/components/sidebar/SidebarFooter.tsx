"use client";

import {
  Settings,
  User,
  Layers,
} from "lucide-react";

import ModelSelector from "./ModelSelector";

export default function SidebarFooter() {
  return (
    <div className="border-t border-zinc-800 p-4 space-y-3">
      {/* Model Selector */}
      <ModelSelector />

      {/* Workspace */}
      <button className="w-full flex items-center gap-3 bg-[#222222] border border-zinc-700 rounded-xl p-3 hover:bg-[#2a2a2a] transition">
        <Layers size={18} />

        <div className="text-left">
          <p className="text-sm font-medium">
            Personal Workspace
          </p>

          <p className="text-xs text-zinc-400">
            Default Workspace
          </p>
        </div>
      </button>

      {/* Settings */}
      <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#232323] transition">
        <Settings size={18} />

        <span className="text-sm">
          Settings
        </span>
      </button>

      {/* User */}
      <button className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#232323] transition">
        <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center">
          <User size={18} />
        </div>

        <div className="text-left">
          <p className="text-sm font-medium">
            Subhasis Roy
          </p>

          <p className="text-xs text-zinc-400">
            Free Plan
          </p>
        </div>
      </button>
    </div>
  );
}