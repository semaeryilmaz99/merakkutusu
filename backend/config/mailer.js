import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
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
        console.log("Email sent to: ", to);
    } catch (err) {
        console.error("Email send failed: ", err.message);
    }
};