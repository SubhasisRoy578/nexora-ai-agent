"use client";

import { FileText, ImageIcon, File } from "lucide-react";

interface Props {
  name: string;
  size: number;
  type: string;
}

export default function FilePreview({
  name,
  size,
  type,
}: Props) {
  const getIcon = () => {
    if (type.includes("image")) {
      return <ImageIcon size={18} />;
    }

    if (type.includes("pdf")) {
      return <FileText size={18} />;
    }

    return <File size={18} />;
  };

  const formatSize = (bytes: number) => {
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="flex items-center gap-3 rounded-xl border border-zinc-700 bg-[#1a1a1a] p-3">
      <div className="text-zinc-300">
        {getIcon()}
      </div>

      <div className="flex flex-col overflow-hidden">
        <span className="truncate text-sm text-white">
          {name}
        </span>

        <span className="text-xs text-zinc-500">
          {formatSize(size)}
        </span>
      </div>
    </div>
  );
}