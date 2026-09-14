// ArticleCard.jsx'in anatomisini (başlık çubuğu, yazar satırı, görsel,
// özet, aksiyon satırı) taklit eden iskelet — liste sayfaları yüklenirken
// düz "Yükleniyor..." metni yerine gerçek düzeni önceden gösterip veri
// gelince sayfanın zıplamasını önler.
export default function ArticleCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="bg-gray-100 px-3 py-2">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2">
        <div className="h-6 w-6 flex-none animate-pulse rounded-full bg-gray-200" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-gray-200" />
      </div>

      <div className="aspect-video w-full animate-pulse bg-gray-100" />

      <div className="flex items-center justify-between gap-2 p-3">
        <div className="h-6 w-14 animate-pulse rounded-full bg-gray-100" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-12 animate-pulse rounded-full bg-gray-100" />
          <div className="h-8 w-8 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>
    </div>
  );
}
