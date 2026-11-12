import "dotenv/config";
import fs from "fs";
import path from "path";
import cloudinary from "../config/cloudinary.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// 30 makalelik yeni seed verisi için kullanıcının gönderdiği görselleri
// Cloudinary'ye yükler, her dosya adına karşılık gelen secure_url'i JSON
// olarak yazar — reseedArticles.js bu dosyayı okuyup makalelere görsel atar.
const IMAGES_DIR =
  "C:/Users/Semanur/AppData/Local/Temp/claude/059ad7e7e3d68929/5c8b0041-1ebd-443e-9649-5e0015b1c0f6/images";

const FILES = [
  "27.jpg", "28.jpg", "29.jpg", "30.jpg", "31.jpg", "32.jpg", "33.jpg",
  "34.jpg", "35.jpg", "36.jpg",
  "37.jpg", "38.jpg", "39.jpg", "40.jpg", "41.jpg", "42.jpg",
  "43.jpg", "44.jpg", "45.jpg", "46.jpg", "47.jpg", "48.jpg", "49.jpg", "50.jpg",
  "51.jpg", "52.jpg", "53.jpg", "54.jpg", "55.jpg"
];

const run = async () => {
  const urlMap = {};
  for (const file of FILES) {
    const filePath = path.join(IMAGES_DIR, file);
    const buffer = fs.readFileSync(filePath);
    const result = await uploadToCloudinary(buffer, {
      folder: "merakkutusu_articles",
      quality: "auto",
      fetch_format: "auto"
    });
    urlMap[file] = result.secure_url;
    console.log(`${file} -> ${result.secure_url}`);
  }

  fs.writeFileSync(
    path.join(process.cwd(), "scripts", "seedImageUrls.json"),
    JSON.stringify(urlMap, null, 2)
  );
  console.log("\nTamamlandı: scripts/seedImageUrls.json yazıldı.");
};

run()
  .catch((err) => {
    console.error("Yükleme hatası:", err.message);
    process.exitCode = 1;
  })
  .finally(() => cloudinary && process.exit());
