"use client";

import { Bell, Settings, UserCircle2 } from "lucide-react";

export default function TopNavbar() {
  return (
    <div className="h-[70px] border-b border-gray-800 bg-[#0a0a0a] flex items-center justify-between px-6">

      <div>
        <h1 className="text-white text-xl font-semibold">
          Nexora Workspace
        </h1>
      </div>

      <div className="flex items-center gap-5 text-gray-400">

        <button className="hover:text-white transition">
          <Bell size={22} />
        </button>

        <button className="hover:text-white transition">
          <Settings size={22} />
        </button>

        <button className="hover:text-white transition">
          <UserCircle2 size={28} />
        </button>

      </div>

    </div>
  );
}