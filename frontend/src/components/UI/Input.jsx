export default function Input({ label, error, ...props }) {
  return (
    <div className="mb-4">
      <div className="mb-2 rounded-full bg-gray-200 px-4 py-2 text-center text-xs font-semibold uppercase tracking-wide text-brand-900">
        {label}
      </div>
      <input
        className={`w-full rounded-full bg-accent-gold px-4 py-3 text-brand-900 placeholder-brand-900/50 outline-none focus:ring-2 focus:ring-brand-900 ${
          error ? "ring-2 ring-accent-coral" : ""
        }`}
        {...props}
      />
      {error && <p className="mt-1 px-2 text-xs text-accent-coral">{error}</p>}
    </div>
  );
}
