export default function Input({ label, error, id, maxLength, value, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const showCounter = typeof maxLength === "number" && typeof value === "string";

  return (
    <div className="mb-4">
      <label
        htmlFor={inputId}
        className="mb-2 block rounded-full bg-gray-200 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-900"
      >
        {label}
      </label>
      <input
        id={inputId}
        maxLength={maxLength}
        value={value}
        className={`w-full rounded-full bg-accent-gold px-4 py-3 text-brand-900 placeholder-brand-900/50 outline-none focus:ring-2 focus:ring-brand-900 ${
          error ? "ring-2 ring-accent-coral" : ""
        }`}
        {...props}
      />
      {showCounter && (
        <p className="mt-1 px-2 text-right text-[10px] text-gray-400">
          {value.length}/{maxLength}
        </p>
      )}
      {error && <p className="mt-1 px-2 text-xs text-accent-coral">{error}</p>}
    </div>
  );
}
