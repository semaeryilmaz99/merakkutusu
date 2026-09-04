import mongoose from "mongoose";
import dns from "dns";
import logger from "./logger.js";

// Node'un Windows'ta bazı ağlarda (ör. mobil hotspot) SRV DNS sorgularını
// yanlış çözmesini önlemek için sabit bir resolver kullanılıyor.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        logger.info("MongoDB bağlantısı başarılı");
    } catch (err) {
        logger.error("MongoDB bağlantı hatası", { message: err.message });
        process.exit(1);
    }
};

export default connectDB;