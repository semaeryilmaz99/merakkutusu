export default function StatPill({ label, value, onClick }) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      className={`flex h-14 w-14 flex-none flex-col items-center justify-center rounded-full bg-brand-700 text-white ${
        onClick ? "hover:bg-brand-600" : ""
      }`}
    >
      <span className="text-sm font-bold">{value}</span>
      <span className="text-[10px]">{label}</span>
    </Tag>
  );
}
