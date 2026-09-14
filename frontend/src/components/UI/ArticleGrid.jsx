// Makale kartı listeleyen 7 farklı sayfada BİREBİR aynı responsive grid
// class dizisi tekrarlanıyordu (bazılarında xl:grid-cols-3 unutulmuş, iki
// farklı sonuç veriyordu) — artık tek, standart tanım burada.
export default function ArticleGrid({ children, className = "" }) {
  return (
    <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${className}`}>{children}</div>
  );
}
