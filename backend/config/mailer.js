import logger from "./logger.js";

// Render'ın ücretsiz planı, Eylül 2025'ten itibaren kötüye kullanımı önlemek için
// giden SMTP bağlantılarını (587/465/25 portları) tamamen engelliyor — bu yüzden
// Nodemailer ile doğrudan Gmail SMTP'ye bağlanmak production'da timeout'a düşüyordu.
// Bunun yerine HTTPS (443) üzerinden çalışan Brevo'nun transactional email REST
// API'sini kullanıyoruz; Render bu trafiği engellemiyor.
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendEmail = async (to, subject, html) => {
  try {
    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "api-key": process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { email: process.env.EMAIL_FROM || process.env.SMTP_USER, name: "Merakkutusu" },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API hatası (${response.status}): ${errorBody}`);
    }

    logger.info("Email başarıyla gönderildi", { to });
  } catch (error) {
    logger.error("Email gönderilemedi", { to, message: error.message });
    throw error;
  }
};
