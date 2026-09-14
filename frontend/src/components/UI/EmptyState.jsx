import { Link } from "react-router-dom";

// İkon + başlık + opsiyonel CTA alan, liste sayfalarındaki düz "boş" metinlerinin
// yerini alan paylaşılan bileşen. `action` verilirse (örn. {label, to}) bir
// çağrı butonu render edilir, verilmezse sadece mesaj gösterilir.
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {Icon && <Icon size={28} className="mb-1 text-gray-300" />}
      <p className="text-sm font-medium text-brand-900">{title}</p>
      {description && <p className="max-w-xs text-xs text-gray-500">{description}</p>}
      {action && (
        <Link
          to={action.to}
          className="mt-2 rounded-full bg-accent-gold px-4 py-2 text-xs font-semibold text-brand-900 hover:brightness-95"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
