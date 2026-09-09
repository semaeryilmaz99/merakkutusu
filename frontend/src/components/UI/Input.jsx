export default function Input({ label, error, id, maxLength, value, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
  const showCounter = typeof maxLength === "number" && typeof value === "string";

  return (
    <div className="mb-4">
      <label htmlFor={inputId} className="mb-1.5 block px-1 text-xs font-medium text-brand-800">
        {label}
      </label>
      <input
        id={inputId}
        maxLength={maxLength}
        value={value}
        className={`w-full rounded-full border border-gray-300 bg-white px-4 py-3 text-brand-900 placeholder-gray-400 outline-none transition-colors focus:border-accent-gold focus:ring-2 focus:ring-accent-gold/30 ${
          error ? "border-accent-coral focus:border-accent-coral focus:ring-accent-coral/30" : ""
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
