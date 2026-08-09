export default function TypingLoader() {
  return (
    <div className="flex justify-start">
      <div className="bg-zinc-900 border border-zinc-800 px-6 py-4 rounded-3xl flex gap-2">

        <div className="w-3 h-3 bg-white rounded-full animate-bounce" />
        <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-100" />
        <div className="w-3 h-3 bg-white rounded-full animate-bounce delay-200" />

      </div>
    </div>
  );
}