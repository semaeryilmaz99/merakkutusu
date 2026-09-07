const SEARCH_URL = "https://api.core.ac.uk/v3/search/works";
const CANDIDATE_LIMIT = 20;

// CORE, dünya genelinde açık erişim repository'lerini (üniversite arşivleri,
// tezler, "grey literature" dahil) topluyor — OpenAlex'in ağırlıklı olarak
// dergi/atıf grafiğine odaklanmasından farklı bir havuz, bu yüzden çakışma
// değil tamamlayıcı bir ikinci kaynak. Ücretsiz ama email ile alınan bir
// key gerekiyor (core.ac.uk/services/api) — CORE_API_KEY set edilmezse bu
// kaynak sessizce atlanır, sadece OpenAlex ile devam edilir.
export default async function searchPapers(query) {
  if (!process.env.CORE_API_KEY) return [];

  const params = new URLSearchParams({ q: query, limit: String(CANDIDATE_LIMIT) });
  const response = await fetch(`${SEARCH_URL}?${params}`, {
    headers: { Authorization: `Bearer ${process.env.CORE_API_KEY}` }
  });

  if (!response.ok) {
    throw new Error(`CORE araması başarısız (status ${response.status})`);
  }

  const { results } = await response.json();

  return (results || [])
    .map((paper) => ({
      // "core:" öneki, PaperCache'teki externalId'nin OpenAlex kayıtlarıyla
      // (ör. "https://openalex.org/W123") çakışmamasını garanti eder.
      externalId: `core:${paper.id}`,
      title: paper.title,
      abstract: paper.abstract,
      url:
        paper.links?.[0]?.url ||
        (paper.doi ? `https://doi.org/${paper.doi}` : `https://core.ac.uk/works/${paper.id}`),
      year: paper.yearPublished,
      authors: (paper.authors || [])
        .map((a) => (typeof a === "string" ? a : a.name))
        .filter(Boolean)
    }))
    .filter((paper) => paper.title && paper.abstract);
}
