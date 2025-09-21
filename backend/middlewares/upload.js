import multer from "multer";

// Memory storage kullanıyoruz, dosya direkt Cloudinary’ye gidecek
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Sadece resim yüklenebilir."), false);
  }
};

const upload = multer({storage, fileFilter});

export default upload;
