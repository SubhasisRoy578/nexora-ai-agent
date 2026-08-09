"use client";

import { Sparkles } from "lucide-react";

interface Props {
  setInput: (value: string) => void;
}

const prompts = [
  "Build me a SaaS landing page",
  "Explain quantum computing",
  "Generate Python API code",
  "Analyze startup ideas",
];

export default function EmptyState({
  setInput,
}: Props) {
  return (
    <div className="h-full flex flex-col justify-center items-center text-center">

      <div className="w-28 h-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 blur-2xl opacity-40 absolute" />

      <div className="relative z-10">

        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 mx-auto flex items-center justify-center shadow-2xl shadow-indigo-500/40 animate-pulse">
          <Sparkles size={40} />
        </div>

        <h1 className="text-6xl font-bold mt-8 bg-gradient-to-r from-white to-zinc-500 bg-clip-text text-transparent">
          Nexora AI
        </h1>

        <p className="text-zinc-500 mt-4 text-lg">
          Autonomous Multi-Agent Intelligence
        </p>

        <div className="grid grid-cols-2 gap-4 mt-12 max-w-3xl">

          {prompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => setInput(prompt)}
              className="bg-zinc-900 border border-zinc-800 hover:border-indigo-500 hover:bg-zinc-800 transition rounded-2xl p-5 text-left"
            >
              {prompt}
            </button>
          ))}

        </div>
      </div>
    </div>
  );
}