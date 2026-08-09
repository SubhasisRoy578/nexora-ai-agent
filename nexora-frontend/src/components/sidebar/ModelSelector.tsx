export default function ModelSelector() {
  return (
    <div className="bg-[#171717] border border-gray-800 p-4 rounded-2xl">

      <p className="text-gray-400 text-sm mb-2">
        Active Model
      </p>

      <select className="w-full bg-[#0f0f0f] text-white p-3 rounded-xl outline-none">

        <option>GPT-4o</option>

        <option>Claude 3.5 Sonnet</option>

        <option>Gemini 1.5 Pro</option>

        <option>Llama 3 70B</option>

      </select>

    </div>
  );
}