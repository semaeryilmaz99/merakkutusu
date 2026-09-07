import multer from "multer";

// middlewares/upload.js'e paralel ama ayrı bir instance — o sadece görsel
// kabul ediyor (makale/avatar akışları için), burada PDF de kabul etmemiz
// gerekiyor. Paylaşılan middleware'i değiştirmek diğer tüm yükleme
// akışlarını etkilerdi, bu yüzden notlara özel ayrı bir dosya.
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/") || file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Sadece resim veya PDF yüklenebilir."), false);
  }
};

const uploadNote = multer({
  storage,
  fileFilter,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB — ders notu PDF'leri kapak görsellerinden büyük olabilir
});

export default uploadNote;
