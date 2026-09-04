import "dotenv/config";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// JWT_SECRET/JWT_REFRESH_SECRET gibi env değişkenleri testler için burada
// açıkça yükleniyor — daha önce bu, articleController.js'in import zincirinde
// yer alan config/cloudinary.js'in kendi dotenv.config() çağrısına tesadüfen
// dayanıyordu. CI'da hiç .env dosyası olmayacağı için (gitignore'da) bu
// tesadüf orada işe yaramaz; workflow bu değişkenleri kendi env'inden verir.

// Testler gerçek MongoDB Atlas'a asla dokunmuyor — her test dosyası kendi
// bellekteki (in-memory) geçici MongoDB instance'ına bağlanıyor, birbirinden
// ve gerçek/seed verisinden tamamen izole.
let mongoServer;

export const connect = async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

export const closeDatabase = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongoServer.stop();
};
