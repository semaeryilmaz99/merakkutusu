// REST tarafında express-rate-limit var ama o HTTP middleware'i — Socket.IO
// event'leri (send_message, typing) için karşılığı yok, bu yüzden küçük bir
// sabit pencereli sayaç burada. Anahtar `${socket.id}:${action}` — bir socket
// bağlantısı koptuğunda chatSocket.js clearSocketBuckets'ı çağırıp o soketin
// kayıtlarını siliyor, aksi halde Map süresiz büyürdü.
const buckets = new Map();

export function allowSocketAction(socketId, action, { max, windowMs }) {
  const key = `${socketId}:${action}`;
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.start > windowMs) {
    buckets.set(key, { start: now, count: 1 });
    return true;
  }

  if (bucket.count >= max) return false;
  bucket.count += 1;
  return true;
}

export function clearSocketBuckets(socketId) {
  for (const key of buckets.keys()) {
    if (key.startsWith(`${socketId}:`)) buckets.delete(key);
  }
}
