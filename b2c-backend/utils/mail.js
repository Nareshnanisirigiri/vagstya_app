import nodemailer from "nodemailer";

let transporterPromise = null;

function toBoolean(value, fallback = false) {
  if (value == null || value === "") return fallback;
  return String(value).trim().toLowerCase() === "true";
}

async function getTransporter() {
  if (transporterPromise) {
    return transporterPromise;
  }

  transporterPromise = (async () => {
    const user = String(process.env.MAIL_USER || "").trim();
    const pass = String(process.env.MAIL_PASS || "").trim();

    if (!user || !pass) {
      throw new Error("MAIL_USER or MAIL_PASS not configured in .env");
    }

    const configuredHost = String(process.env.MAIL_HOST || "").trim();
    const configuredPort = Number(process.env.MAIL_PORT || 0);
    const configuredSecure = toBoolean(process.env.MAIL_SECURE, configuredPort === 465);
    const configuredService = String(process.env.MAIL_SERVICE || "").trim();

    const transporter = nodemailer.createTransport(
      configuredHost
        ? {
            host: configuredHost,
            port: configuredPort || 587,
            secure: configuredSecure,
            requireTLS: toBoolean(process.env.MAIL_REQUIRE_TLS, true),
            auth: { user, pass },
          }
        : {
            service: configuredService || "gmail",
            auth: { user, pass },
          }
    );

    await transporter.verify();
    return transporter;
  })().catch((error) => {
    transporterPromise = null;
    throw error;
  });

  return transporterPromise;
}

export const sendMail = async (to, subject, text, html) => {
  const recipient = String(to || "").trim();
  const user = String(process.env.MAIL_USER || "").trim();
  const fromAddress = String(process.env.MAIL_FROM || user).trim();
  const fromName = String(process.env.MAIL_FROM_NAME || "VOGSTYA Store").trim();

  if (!recipient) {
    throw new Error("Recipient email address is required.");
  }

  const transporter = await getTransporter();

  try {
    console.log(`Sending email to ${recipient}...`);
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: recipient,
      subject,
      text,
      html,
    });
    console.log(`Email sent successfully to ${recipient}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Failed to send email to ${recipient}:`, error.message);
    throw error;
  }
};
