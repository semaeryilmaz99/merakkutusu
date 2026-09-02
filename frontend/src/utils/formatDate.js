export function formatRelativeDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (daysAgo <= 0) return "bugün";
  if (daysAgo === 1) return "dün";
  if (daysAgo < 7) return `${daysAgo} gün önce`;
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export function formatFullDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const datePart = date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
  const timePart = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}
