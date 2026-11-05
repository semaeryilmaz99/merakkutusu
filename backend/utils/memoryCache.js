// Sınırlı boyutlu, TTL'li basit bir bellek-içi önbellek — dış bir servis
// (Redis vb.) gerektirmeden aynı pahalı işi tekrarlamamak için. Sunucu süreci
// yeniden başlayınca sıfırlanır, bu bir cache için kabul edilebilir bir durum.
// maxSize aşılırsa Map'in ekleme sırasını koruyan doğal davranışından
// yararlanılıp en eski kayıt silinir (basit FIFO), sınırsız büyümeyi önler.
export default function createMemoryCache({ ttlMs, maxSize }) {
  const store = new Map();

  const get = (key) => {
    const entry = store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      store.delete(key);
      return undefined;
    }
    return entry.value;
  };

  const set = (key, value) => {
    if (!store.has(key) && store.size >= maxSize) {
      const oldestKey = store.keys().next().value;
      store.delete(oldestKey);
    }
    store.set(key, { value, expiresAt: Date.now() + ttlMs });
  };

  return { get, set };
}
