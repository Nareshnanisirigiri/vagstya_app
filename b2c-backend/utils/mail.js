import nodemailer from "nodemailer";

export const sendMail = async (to, subject, text, html) => {
  const user = process.env.MAIL_USER;
  const pass = process.env.MAIL_PASS;

  if (!user || !pass) {
    console.error("❌ Mail Error: MAIL_USER or MAIL_PASS not configured in .env");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass }
  });

  try {
    console.log(`📧 Sending email to ${to}...`);
    await transporter.sendMail({
      from: `"VOGSTYA Store" <${user}>`,
      to,
      subject,
      text,
      html
    });
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
  }
};