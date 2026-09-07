import OpenAI from "openai";

// config/cloudinary.js ile aynı desen — tek bir client instance'ı oluşturulup
// heryerden bu import edilir, her çağrıda yeniden oluşturulmaz.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default openai;
