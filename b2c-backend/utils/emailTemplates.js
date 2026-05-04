const BRAND_COLOR = "#0d5731"; // Forest Green
const ACCENT_COLOR = "#d97706"; // Gold
const BG_COLOR = "#f4f7f6";
const TEXT_COLOR = "#1f2937";
const WEB_APP_URL = process.env.FRONTEND_URL || "https://vagstyaapp.vercel.app";

const baseTemplate = (content, previewText = "") => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VOGSTYA</title>
    <style>
        body { margin: 0; padding: 0; background-color: ${BG_COLOR}; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased; }
        .wrapper { width: 100%; table-layout: fixed; background-color: ${BG_COLOR}; padding-bottom: 40px; }
        .main { background-color: #ffffff; margin: 0 auto; width: 100%; max-width: 600px; border-spacing: 0; color: ${TEXT_COLOR}; border-radius: 12px; overflow: hidden; margin-top: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, #0d3b25 0%, ${BRAND_COLOR} 100%); padding: 40px 20px; text-align: center; }
        .logo { color: #ffffff; font-size: 28px; font-weight: 800; letter-spacing: 4px; text-decoration: none; margin: 0; text-transform: uppercase; }
        .content { padding: 40px 30px; line-height: 1.6; }
        .h1 { font-size: 24px; font-weight: 700; color: ${BRAND_COLOR}; margin-bottom: 20px; text-align: center; }
        .p { margin-bottom: 20px; font-size: 16px; color: #4b5563; }
        .button-container { text-align: center; margin: 30px 0; }
        .button { background-color: ${BRAND_COLOR}; color: #ffffff !important; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 700; display: inline-block; transition: all 0.3s ease; }
        .order-summary { background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 20px 0; border: 1px solid #e5e7eb; }
        .summary-row { display: flex; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px dashed #e5e7eb; padding-bottom: 8px; }
        .summary-label { color: #6b7280; font-size: 14px; font-weight: 600; }
        .summary-value { color: ${TEXT_COLOR}; font-size: 14px; font-weight: 700; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #9ca3af; }
        .divider { height: 1px; background-color: #e5e7eb; margin: 30px 0; }
        @media screen and (max-width: 600px) {
            .content { padding: 30px 20px; }
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0px; overflow: hidden;">${previewText}</div>
    <center class="wrapper">
        <table class="main" width="100%">
            <tr>
                <td class="header">
                    <h1 class="logo">VOGSTYA</h1>
                </td>
            </tr>
            <tr>
                <td class="content">
                    ${content}
                </td>
            </tr>
            <tr>
                <td class="footer">
                    &copy; 2026 VOGSTYA Luxury Jewellery & Fashion. All rights reserved.<br>
                    Plot No. 12, High-End District, Hyderabad, India.<br>
                    <a href="#" style="color: ${BRAND_COLOR}; text-decoration: none;">Privacy Policy</a> | <a href="#" style="color: ${BRAND_COLOR}; text-decoration: none;">Contact Us</a>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>
`;

export const welcomeTemplate = (name) => baseTemplate(`
    <h1 class="h1">Welcome to the World of Elegance!</h1>
    <p class="p">Hi <strong>${name}</strong>,</p>
    <p class="p">We are absolutely delighted to have you join the VOGSTYA family. Your journey into the world of luxury jewellery and timeless fashion starts right here.</p>
    <p class="p">Discover our curated collections and enjoy a seamless shopping experience tailored just for you.</p>
    <div class="button-container">
        <a href="${WEB_APP_URL}/shop" class="button">Explore Collections</a>
    </div>
    <p class="p">If you have any questions, our concierge team is always here to assist you.</p>
`, "Welcome to VOGSTYA - Your account is ready!");

export const forgotPasswordTemplate = (name, link) => baseTemplate(`
    <h1 class="h1">Password Reset Request</h1>
    <p class="p">Hi <strong>${name}</strong>,</p>
    <p class="p">We received a request to reset your password for your VOGSTYA account. No worries, it happens to the best of us!</p>
    <p class="p">Click the button below to set a new password. This link will remain active for the next 1 hour.</p>
    <div class="button-container">
        <a href="${link}" class="button">Reset Password</a>
    </div>
    <p class="p" style="font-size: 14px; color: #9ca3af;">If you didn't request this change, you can safely ignore this email. Your password will remain unchanged.</p>
`, "Reset your VOGSTYA account password");

export const orderUpdateTemplate = (name, orderCode, topic, description, details = [], orderId = "") => {
    const detailHtml = details.map(d => `
        <div class="summary-row">
            <span class="summary-label">${d.label}</span>
            <span class="summary-value">${d.value}</span>
        </div>
    `).join("");
    const trackUrl = orderId ? `${WEB_APP_URL}/track-order?orderId=${encodeURIComponent(orderId)}` : `${WEB_APP_URL}/orders`;

    return baseTemplate(`
        <div style="text-align: center; margin-bottom: 10px;">
            <span style="background-color: ${BRAND_COLOR}1A; color: ${BRAND_COLOR}; padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">
                ${topic.badge}
            </span>
        </div>
        <h1 class="h1">${topic.title}</h1>
        <p class="p">Hi <strong>${name}</strong>,</p>
        <p class="p">${description}</p>
        
        <div class="order-summary">
            <div style="text-align: center; margin-bottom: 15px; font-size: 14px; font-weight: 700; color: ${BRAND_COLOR};">
                ORDER ID: ${orderCode}
            </div>
            ${detailHtml}
        </div>

        <div class="button-container">
            <a href="${trackUrl}" class="button">Track Order Status</a>
        </div>
        
        <p class="p">Thank you for choosing VOGSTYA. We truly appreciate your patronage.</p>
    `, `Update for Order ${orderCode}: ${topic.badge}`);
};
