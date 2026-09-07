import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";

// Env değişkenleri (.env yüklemesi + test'e özel sahte değerler) artık
// vitest.config.js'in setupFiles'ı olan tests/setupEnv.js'de, her test
// dosyasının kendi import'larından ÖNCE garantili şekilde yükleniyor —
// daha önce bu burada (dbHandler.js'de) dotenv/config importuyla yapılıyordu
// ama import sırasına bağımlıydı (bkz. setupEnv.js'deki not).

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
