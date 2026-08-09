import { Message } from "@/types/chat";

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`
          max-w-[80%]
          rounded-2xl
          px-5
          py-4
          text-sm
          leading-relaxed
          shadow-lg
          ${
            isUser
              ? "bg-white text-black"
              : "bg-zinc-800 text-zinc-200"
          }
        `}
      >
        {message.content}
      </div>
    </div>
  );
}