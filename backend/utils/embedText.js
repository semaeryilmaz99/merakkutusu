import openai from "./openaiClient.js";

const MAX_CHARS = 2000; // token maliyetini sınırlamak için — tüm makaleyi değil, özünü embed ediyoruz
const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536 boyutlu, ucuz, RAG için yeterli kalitede

// Metni 1536 boyutlu bir vektöre çevirir — bu vektör, metnin "anlamsal konumunu"
// temsil eder. Anlamca yakın iki metnin vektörleri de birbirine yakın olur,
// bu sayede kelime eşleşmesi değil anlam benzerliği üzerinden arama yapılabilir.
export default async function embedText(text) {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

// Birden fazla metni TEK bir API çağrısında embed eder (OpenAI'ın embeddings
// endpoint'i input olarak bir dizi kabul ediyor) — cache'e yeni eklenen 10-20
// makale için tek tek istek atmak yerine tek istekle hepsini embed ediyoruz.
export async function embedTexts(texts) {
  if (texts.length === 0) return [];
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts.map((t) => t.slice(0, MAX_CHARS))
  });
  return response.data.map((d) => d.embedding);
}
