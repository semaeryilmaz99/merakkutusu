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

// AdminPanel/Notes gibi tablo/liste görünümlerinde kullanılan sade gün.ay.yıl
// biçimi — daha önce her sayfa kendi `new Date(...).toLocaleDateString(...)`
// çağrısını tekrarlıyordu.
export function formatShortDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("tr-TR");
}

// ChatPanel'deki mesaj balonlarında sadece saat:dakika gösteriliyor.
export function formatTime(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}
