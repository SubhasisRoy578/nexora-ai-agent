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
      onChange={(e) =>
        setModel(e.target.value)
      }
      className="bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2"
    >
      <option value="gemini">
        Gemini Flash
      </option>

      <option value="gemini-pro">
        Gemini Pro
      </option>
    </select>
  );
}