const SEARCH_URL = "https://api.openalex.org/works";
const CANDIDATE_LIMIT = 20;
const SELECT_FIELDS = "id,title,abstract_inverted_index,publication_year,authorships,doi,primary_location";

// OpenAlex, abstract'ı düz metin değil "inverted index" olarak döner —
// {kelime: [geçtiği pozisyonlar]} — bunu düz metne geri çeviriyoruz.
// (Yayıncı telif kısıtlamaları yüzünden bazı akademik API'ler abstract'ı
// tam metin olarak değil bu dolaylı formatta veriyor.)
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return "";
  const words = [];
  for (const [word, positions] of Object.entries(invertedIndex)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.join(" ").trim();
}

// OpenAlex herkese açık, key gerektirmeyen bir akademik makale API'si (Semantic
// Scholar'ın aksine anonim key isteme/onay derdi yok). OPENALEX_MAILTO env
// değişkeni set edilirse (herhangi bir email olabilir, doğrulama gerekmiyor)
// "polite pool"a girip daha güvenilir/hızlı servis alınır — set edilmezse de
// çalışır, sadece öncelik daha düşük.
export default async function searchPapers(query) {
  const params = new URLSearchParams({
    search: query,
    per_page: String(CANDIDATE_LIMIT),
    select: SELECT_FIELDS
  });
  if (process.env.OPENALEX_MAILTO) params.set("mailto", process.env.OPENALEX_MAILTO);

  const response = await fetch(`${SEARCH_URL}?${params}`);
  if (!response.ok) {
    throw new Error(`OpenAlex araması başarısız (status ${response.status})`);
  }

  const { results } = await response.json();

  return (results || [])
    .map((work) => ({
      externalId: work.id,
      title: work.title,
      abstract: reconstructAbstract(work.abstract_inverted_index),
      url: work.doi || work.primary_location?.landing_page_url || work.id,
      year: work.publication_year,
      authors: (work.authorships || []).map((a) => a.author?.display_name).filter(Boolean)
    }))
    .filter((paper) => paper.title && paper.abstract); // abstract'ı olmayanlar embed edilemez
}
