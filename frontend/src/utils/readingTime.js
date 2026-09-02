const WORDS_PER_MINUTE = 200;

export function getReadingMinutes(content) {
  const wordCount = (content || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
