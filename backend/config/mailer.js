import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,   // smtp.gmail.com
  port: process.env.SMTP_PORT,   // 587
  secure: false, // TLS kullanılacak
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export const sendEmail = async (to, subject, html) => {
try {
    await transporter.sendMail({
        from: `"Merakkutusu" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html
    });

    console.log("Email başarıyla gönderildi:", to);
} catch (error) {
    console.error("Email gönderilemedi:", error.message);
    throw error;
}
};
