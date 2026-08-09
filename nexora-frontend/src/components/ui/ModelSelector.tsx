interface Props {
  model: string;
  setModel: (value: string) => void;
}

export default function ModelSelector({
  model,
  setModel,
}: Props) {
  return (
    <select
      value={model}
      onChange={(e) => setModel(e.target.value)}
      className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-2xl outline-none"
    >
      <option value="gemini">
        Gemini 2.0 Flash
      </option>

      <option value="gpt4">
        GPT-4 Turbo
      </option>

      <option value="claude">
        Claude 3.5 Sonnet
      </option>

      <option value="groq">
        Llama 3 Groq
      </option>
    </select>
  );
}