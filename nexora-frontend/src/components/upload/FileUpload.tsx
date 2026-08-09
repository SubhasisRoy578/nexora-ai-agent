export default function FileUpload() {
  return (
    <label className="cursor-pointer bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-700">

      Upload File

      <input
        type="file"
        className="hidden"
      />
    </label>
  );
}