import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-brand-800 p-6 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-wide text-brand-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-full bg-white p-2 text-brand-900 hover:bg-accent-gold transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
