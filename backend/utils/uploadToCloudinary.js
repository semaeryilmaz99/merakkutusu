import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";

// Multer'ın bellekteki buffer'ını Cloudinary'ye stream olarak yükler. Bu
// "buffer'ı Readable'a sar, upload_stream'e pipe'la, sonucu Promise'e sar"
// bloğu daha önce article/avatar/chat/note controller'larında (4-6 yerde)
// birebir kopyalanmıştı — tek bir yerde toplanınca upload davranışı
// (hata yönetimi, ileride eklenecek boyut/retry kuralları) her yerde tutarlı olur.
export default function uploadToCloudinary(buffer, options) {
  const bufferStream = new Readable();
  bufferStream.push(buffer);
  bufferStream.push(null);

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    bufferStream.pipe(stream);
  });
}
