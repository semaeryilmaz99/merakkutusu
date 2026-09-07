import openai from "./openaiClient.js";

const MODEL = "gpt-4o-mini";

// Akademik API'ler (OpenAlex, CORE) ağırlıklı İngilizce içerik indekslediği
// için Türkçe bir sorguyu olduğu gibi göndermek neredeyse hiç sonuç getirmiyor
// (canlı testte doğrulandı: Türkçe sorgu = 0 sonuç, İngilizce karşılığı =
// binlerce sonuç). Bu yüzden aramadan önce LLM'e kısa, İngilizce akademik
// anahtar kelimelere çevirtiyoruz — RAG'de "query rewriting/translation"
// olarak bilinen bir teknik.
export default async function translateSearchQuery(text) {
  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content:
          "Verilen başlık/etiketlerden, akademik makale aramak için 3-6 kelimelik kısa, İngilizce " +
          "anahtar kelimeler çıkar. Sadece anahtar kelimeleri boşlukla ayırarak yaz, başka hiçbir şey ekleme."
      },
      { role: "user", content: text }
    ]
  });

  return completion.choices[0].message.content.trim();
}
