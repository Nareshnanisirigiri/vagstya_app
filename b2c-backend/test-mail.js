import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const testMail = async () => {
  try {
    console.log("Using MAIL_USER:", process.env.MAIL_USER);
    // don't log full password for security
    console.log("Using MAIL_PASS length:", process.env.MAIL_PASS ? process.env.MAIL_PASS.length : 0);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    console.log("Sending mail...");
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: "shree.nani319@gmail.com",
      subject: "Test Mail from Vogstya",
      text: "This is a test mail to check if nodemailer is working."
    });

    console.log("Mail sent successfully!", info.messageId);
  } catch (error) {
    console.error("Failed to send mail:");
    console.error(error);
  }
};

testMail();
