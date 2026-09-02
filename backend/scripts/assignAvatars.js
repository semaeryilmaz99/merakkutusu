import "dotenv/config";
import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import connectDB from "../config/db.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// Kullanıcının Downloads klasörüne bıraktığı stok portre fotoğraflarını
// test/demo kullanıcılarına avatar olarak atar (tek seferlik script).
const DOWNLOADS_DIR = "C:\\Users\\Semanur\\Downloads";

const ASSIGNMENTS = {
  semaeryilmaz: "aiony-haust-3TLl_97HNJo-unsplash.jpg",
  semaeryilmaz2: "ashton-bingham-EQFtEzJGERg-unsplash.jpg",
  elifyilmaz: "yueying-sun-f14R7kpg4h4-unsplash.jpg",
  canozturk: "diego-hernandez-MSepzbKFz10-unsplash.jpg",
  zeynepkaya: "christopher-campbell-rDEOVtE7vOs-unsplash.jpg",
  mertdemir: "gabriel-silverio-u3WmDyKGsrY-unsplash.jpg",
  ayseinal: "ben-sweet-2LowviVHZ-E-unsplash.jpg",
  burakaydin: "pavel-kosov-nLNguQNxLAE-unsplash.jpg",
};

const run = async () => {
  await connectDB();

  for (const [username, filename] of Object.entries(ASSIGNMENTS)) {
    const user = await User.findOne({ username });
    if (!user) {
      console.log(`Kullanıcı bulunamadı, atlandı: ${username}`);
      continue;
    }

    const filePath = path.join(DOWNLOADS_DIR, filename);
    const buffer = fs.readFileSync(filePath);

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "merakkutusu_avatars", quality: "auto", fetch_format: "auto" },
        (err, res) => {
          if (err) return reject(err);
          resolve(res);
        }
      );
      stream.end(buffer);
    });

    user.avatar = result.secure_url;
    await user.save();
    console.log(`${username} -> ${result.secure_url}`);
  }

  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error("Hata:", err);
  process.exit(1);
});
