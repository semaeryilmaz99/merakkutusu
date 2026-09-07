import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="flex max-h-full w-full max-w-lg flex-col rounded-2xl bg-brand-800 text-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-none items-center justify-between p-6 pb-4">
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
        <div className="overflow-y-auto px-6 pb-6">{children}</div>
      </div>
    </div>
  );
}
