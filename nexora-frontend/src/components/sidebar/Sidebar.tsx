import {
  MessageSquare,
  Brain,
  Upload,
  Database,
  History,
} from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-80 border-r border-zinc-800 bg-zinc-950/90 backdrop-blur-xl flex flex-col justify-between">

      <div>

        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold">
                Nexora
              </h1>

              <p className="text-zinc-500 text-sm">
                AI Agent Platform
              </p>
            </div>

          </div>
        </div>

        {/* Buttons */}
        <div className="p-4 space-y-3">

          <button className="w-full bg-white text-black py-4 rounded-2xl font-semibold hover:scale-[1.02] transition">
            + New Chat
          </button>

          <SidebarItem icon={<History size={20} />} text="Chat History" />
          <SidebarItem icon={<Brain size={20} />} text="AI Models" />
          <SidebarItem icon={<Upload size={20} />} text="Uploads" />
          <SidebarItem icon={<Database size={20} />} text="Memory" />
        </div>
      </div>

      {/* Profile */}
      <div className="p-4 border-t border-zinc-800">

        <div className="bg-zinc-900 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600" />

          <div>
            <h3 className="font-semibold">
              Subhasis Roy
            </h3>

            <p className="text-zinc-500 text-sm">
              Free Plan
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <button className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 transition p-4 rounded-2xl text-left">
      {icon}
      <span>{text}</span>
    </button>
  );
}