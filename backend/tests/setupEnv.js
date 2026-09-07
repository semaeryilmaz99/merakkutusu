import "dotenv/config";

// JWT_SECRET/JWT_REFRESH_SECRET/FRONTEND_URL gibi değişkenler .env'den (varsa)
// yükleniyor. Bu dosya vitest.config.js'in setupFiles'ı olarak tanımlı —
// Vitest bunu HER test dosyasının kendi import'ları değerlendirilmeden ÖNCE
// çalıştırmayı garanti ediyor. Bu, aşağıdaki OPENAI_API_KEY satırı için kritik:
// OpenAI SDK'sı client oluşturulurken (import zamanında, utils/openaiClient.js)
// key yoksa hemen fırlıyor — bir test dosyasının kendi içinde "önce dbHandler'ı,
// sonra app.js'i import et" sırasına güvenmek kırılgan olurdu, bu yüzden env
// değişkeni burada, her şeyden önce garantili şekilde set ediliyor.
process.env.OPENAI_API_KEY ||= "test-key-for-vitest";
