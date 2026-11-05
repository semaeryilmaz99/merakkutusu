import { createHash } from "crypto";
import PaperCache from "../models/PaperCache.js";
import searchOpenAlex from "../utils/openAlex.js";
import searchCore from "../utils/core.js";
import embedText, { embedTexts } from "../utils/embedText.js";
import translateSearchQuery from "../utils/translateSearchQuery.js";
import openai from "../utils/openaiClient.js";
import asyncHandler from "../utils/asyncHandler.js";
import createMemoryCache from "../utils/memoryCache.js";
import logger from "../config/logger.js";

// Atlas panelinden "papercaches" koleksiyonunda embedding alanı üzerinde
// oluşturulması gereken vector search index'inin adı — Atlas'taki index
// bu adla oluşturulmazsa $vectorSearch stage'i hata verir.
const VECTOR_INDEX_NAME = "paper_vector_index";
const TOP_K = 5;
const CHAT_MODEL = "gpt-4o-mini";

// PaperCache (yukarıda) makale embedding'lerini önbelleğe alıyor — bu ise
// AYNI taslak için ÜRETİLMİŞ nihai öneri listesini. WriteArticle.jsx'te
// "Kaynak Öner" rayı kapatılıp tekrar açıldığında da aynı isteği yeniden
// atıyor — içerik değişmediyse tüm pipeline'ı (çeviri + 2 dış API + embedding
// + vector search + generation) baştan çalıştırmamak için 1 saatlik bir
// bellek-içi önbellek yeterli (taslaklar kısa ömürlü, Redis gibi paylaşımlı/
// kalıcı bir servis gerekmiyor).
const suggestionCache = createMemoryCache({ ttlMs: 60 * 60 * 1000, maxSize: 200 });

function buildSuggestionCacheKey(title, content, tags) {
  const normalized = `${title}\n${content}\n${[...tags].sort().join(",")}`;
  return createHash("sha256").update(normalized).digest("hex");
}

const normalizeTags = (tags) => {
  if (Array.isArray(tags)) return tags;
  if (typeof tags === "string") return tags.split(",").map((t) => t.trim()).filter(Boolean);
  return [];
};

// Birden fazla kaynaktan (OpenAlex + CORE) gelen adayları tek bir sorguda
// paralel çekip birleştiriyoruz — biri hata verirse (ör. CORE key'siz veya
// geçici olarak erişilemez) diğeri yine de sonuç döner, tüm istek çökmez.
const searchAllSources = async (query) => {
  const results = await Promise.allSettled([searchOpenAlex(query), searchCore(query)]);

  const candidates = [];
  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      candidates.push(...result.value);
    } else {
      logger.warn(`Kaynak araması başarısız oldu (${i === 0 ? "OpenAlex" : "CORE"})`, {
        message: result.reason?.message
      });
    }
  });

  // Aynı makale birden fazla kaynakta çıkabilir — başlığa göre (küçük harf,
  // boşluk normalize edilmiş) tekilleştiriyoruz. DOI her zaman gelmediği için
  // başlık en güvenilir ortak alan.
  const seenTitles = new Set();
  return candidates.filter((paper) => {
    const key = paper.title.toLowerCase().trim();
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });
};

// Makale yazarken kullanıcıya alakalı gerçek akademik kaynaklar önerir (RAG).
// Adımlar: (0) Türkçe taslak İngilizce akademik anahtar kelimelere çevrilir
// (query rewriting), (1) OpenAlex + CORE'dan aday makaleler çekilir — bu
// "retrieval"in ilk kaba eleme aşaması, (2) adaylar embed edilip taslakla
// anlamsal olarak karşılaştırılır (asıl "retrieval"), (3) sadece bulunan
// makalelere dayanarak LLM'e öneri ürettirilir (generation) — LLM'in kendi
// hafızasından kaynak uydurmasını (halüsinasyon) önlemenin kritik noktası burası.
export const suggestSources = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const tags = normalizeTags(req.body.tags);

  const cacheKey = buildSuggestionCacheKey(title, content, tags);
  const cached = suggestionCache.get(cacheKey);
  if (cached) {
    logger.info("Kaynak önerisi cache'ten döndürüldü");
    return res.json(cached);
  }
  const respond = (suggestions) => {
    const body = { suggestions };
    suggestionCache.set(cacheKey, body);
    res.json(body);
  };

  // 1) Türkçe taslağı İngilizce akademik anahtar kelimelere çevirip iki
  // kaynakta paralel arama yap — RAG'in "retrieval" adayları
  const rawQuery = [title, ...tags].filter(Boolean).join(" ");
  const searchQuery = await translateSearchQuery(rawQuery);
  logger.info("Kaynak önerisi araması", { rawQuery, searchQuery });

  const candidates = await searchAllSources(searchQuery);
  logger.info("Aday makale sayısı", { count: candidates.length });

  if (candidates.length === 0) {
    return respond([]);
  }

  // 2) Cache'te olmayan adayları embed edip kaydet (aynı makale tekrar
  // sorgulanırsa yeniden embed edilip para harcanmasın diye)
  const externalIds = candidates.map((c) => c.externalId);
  const alreadyCached = await PaperCache.find({ externalId: { $in: externalIds } }).select("externalId");
  const cachedIds = new Set(alreadyCached.map((c) => c.externalId));
  const uncached = candidates.filter((c) => !cachedIds.has(c.externalId));

  if (uncached.length > 0) {
    const embeddings = await embedTexts(uncached.map((c) => c.abstract));
    await PaperCache.insertMany(
      uncached.map((paper, i) => ({ ...paper, embedding: embeddings[i] })),
      { ordered: false } // biri unique index çakışmasıyla başarısız olursa diğerleri yine de kaydedilsin
    ).catch(() => {
      // Eşzamanlı bir istek aynı makaleyi az önce cache'lemiş olabilir (unique
      // index çakışması) — bu durum zararsız, göz ardı edilebilir.
    });
  }

  // 3) Kullanıcının taslağını embed et, Atlas Vector Search ile en yakın
  // anlamdaki makaleleri bul — asıl "retrieval" adımı bu.
  //
  // ÖNEMLİ: PaperCache paylaşımlı ve kalıcı bir koleksiyon (7 gün TTL) — filter
  // olmadan $vectorSearch, BU isteğin adayları arasında değil, geçmiş TÜM
  // aramalardan birikmiş koleksiyonun tamamında arama yapardı. Bu yüzden
  // externalId ile SADECE bu isteğin taze adaylarına (candidates) sınırlıyoruz.
  const draftEmbedding = await embedText(`${title}\n${content}`);

  const nearestPapers = await PaperCache.aggregate([
    {
      $vectorSearch: {
        index: VECTOR_INDEX_NAME,
        path: "embedding",
        queryVector: draftEmbedding,
        numCandidates: 100,
        limit: TOP_K,
        filter: { externalId: { $in: externalIds } }
      }
    },
    { $project: { _id: 0, title: 1, abstract: 1, url: 1, year: 1, authors: 1 } }
  ]);

  logger.info("Vector search sonucu", { count: nearestPapers.length, titles: nearestPapers.map((p) => p.title) });

  if (nearestPapers.length === 0) {
    return respond([]);
  }

  // 4) LLM'e SADECE bulunan makalelere dayanarak öneri ürettir — "generation"
  const draftExcerpt = content.slice(0, 1500);
  const papersForPrompt = nearestPapers
    .map((p, i) => `${i + 1}. "${p.title}" (${p.year || "yıl bilinmiyor"}) — ${p.abstract.slice(0, 400)}`)
    .join("\n\n");

  const completion = await openai.chat.completions.create({
    model: CHAT_MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Sen bir akademik kaynak önerisi asistanısın. Sana bir yazarın taslak metni ve numaralandırılmış birkaç akademik makale özeti verilecek. " +
          "SADECE sana verilen makaleler arasından, taslakla gerçekten alakalı olanları öner. Alakalı hiçbir makale yoksa boş bir liste dön — " +
          "zorlama bağlantı kurma, ve ASLA sana verilmeyen bir makale/kaynak uydurma. Makaleyi başlığını yeniden yazarak değil, verilen numarasıyla belirt. " +
          'Yanıtı şu JSON şemasıyla ver: {"suggestions": [{"paperIndex": number (makalenin listedeki numarası), "reason": string (tek cümle, Türkçe), "suggestedCitation": string}]}'
      },
      {
        role: "user",
        content: `Taslak başlık: ${title}\n\nTaslak içerik (özet): ${draftExcerpt}\n\nBulunan makaleler:\n${papersForPrompt}`
      }
    ]
  });

  let suggestions = [];
  try {
    const parsed = JSON.parse(completion.choices[0].message.content);
    suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
  } catch (err) {
    logger.error("LLM'den gelen JSON parse edilemedi", { message: err.message });
  }
  logger.info("LLM önerileri (eşleştirmeden önce)", { raw: suggestions });

  // LLM'in döndürdüğü numarayı gerçek makale verisiyle (url dahil) eşleştir —
  // başlık metnini tekrar yazdırıp string eşleşmesine güvenmiyoruz (LLM
  // başlığı ufak bir farkla — kısaltma, tırnak, boşluk — yazarsa eşleşme
  // sessizce başarısız olurdu); LLM'e URL'i tekrar üretmesini de bırakmıyoruz.
  const enriched = suggestions
    .map((s) => {
      const match = nearestPapers[s.paperIndex - 1];
      if (!match) return null;
      return { paperTitle: match.title, reason: s.reason, suggestedCitation: s.suggestedCitation, url: match.url, year: match.year };
    })
    .filter(Boolean);
  logger.info("Son öneriler (eşleştirmeden sonra)", { count: enriched.length });

  respond(enriched);
});
