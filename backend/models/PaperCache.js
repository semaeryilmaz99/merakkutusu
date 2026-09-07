import mongoose from "mongoose";

// Semantic Scholar'dan çekilen adayları embedding'leriyle birlikte geçici olarak
// tutar — aynı makale tekrar sorgulandığında yeniden embed edilip para
// harcanmasın diye (externalId ile önce burada aranır).
const PaperCacheSchema = new mongoose.Schema({
  externalId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  abstract: { type: String, required: true },
  url: { type: String },
  year: { type: Number },
  authors: [{ type: String }],
  embedding: { type: [Number], required: true },
  createdAt: { type: Date, default: Date.now }
});

// TTL index: 7 gün sonra Mongo bu kayıtları otomatik siler — koleksiyon
// sınırsız büyümez, ve makale havuzu zamanla (yeni yayınlar çıktıkça) tazelenir.
PaperCacheSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

const PaperCache = mongoose.model("PaperCache", PaperCacheSchema);
export default PaperCache;
