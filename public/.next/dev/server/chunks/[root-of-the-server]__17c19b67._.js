module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/lib/email.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "sendInterviewInvite",
    ()=>sendInterviewInvite,
    "sendMagicLinkEmail",
    ()=>sendMagicLinkEmail,
    "sendRejectionEmail",
    ()=>sendRejectionEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/resend/dist/index.mjs [app-route] (ecmascript)");
;
function getResend() {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$resend$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Resend"](process.env.RESEND_API_KEY || "re_placeholder");
}
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@hireflow.app";
async function sendRejectionEmail(to, candidateName, jobTitle) {
    await getResend().emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Update on your application for ${jobTitle}`,
        html: `
      <h2>Hi ${candidateName},</h2>
      <p>Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to apply.</p>
      <p>After careful review, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.</p>
      <p>We encourage you to apply for future openings that match your skills. We wish you all the best in your career journey.</p>
      <p>Best regards,<br/>The Hiring Team</p>
    `
    });
}
async function sendMagicLinkEmail(to, token, name) {
    const appUrl = ("TURBOPACK compile-time value", "http://localhost:3000") || "http://localhost:3000";
    const link = `${appUrl}/api/auth/verify-magic-link?token=${token}`;
    await getResend().emails.send({
        from: FROM_EMAIL,
        to,
        subject: "Your HireFlow Login Link",
        html: `
      <h2>Hi ${name},</h2>
      <p>Click the link below to access your application dashboard:</p>
      <p><a href="${link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Access Dashboard</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <p>— HireFlow</p>
    `
    });
}
async function sendInterviewInvite(to, candidateName, jobTitle, roundName, scheduledAt) {
    const dateStr = new Date(scheduledAt).toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short"
    });
    await getResend().emails.send({
        from: FROM_EMAIL,
        to,
        subject: `Interview Scheduled: ${jobTitle} - ${roundName}`,
        html: `
      <h2>Hi ${candidateName},</h2>
      <p>Great news! You've been scheduled for the next stage of the interview process.</p>
      <p><strong>Position:</strong> ${jobTitle}<br/>
      <strong>Round:</strong> ${roundName}<br/>
      <strong>Scheduled:</strong> ${dateStr}</p>
      <p>Please log in to your dashboard for more details.</p>
      <p>Good luck!<br/>The Hiring Team</p>
    `
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__17c19b67._.js.map