import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY?.trim();
const FROM_EMAIL =
  process.env.FROM_EMAIL?.trim() || "onboarding@resend.dev";

if (!apiKey && process.env.NODE_ENV !== "test") {
  console.warn(
    "[Email] RESEND_API_KEY is not set. Emails (magic links, rejections, interview invites) will not be sent. Get a key at https://resend.com"
  );
}

function isEmailConfigured(): boolean {
  if (!apiKey || apiKey === "re_placeholder") {
    return false;
  }
  return true;
}

function getResend(): Resend {
  if (!isEmailConfigured()) {
    throw new Error(
      "RESEND_API_KEY is not set or invalid. Emails are disabled. Add a key from https://resend.com to .env and restart."
    );
  }
  return new Resend(apiKey!);
}

/** Call before sending; returns false if email is disabled (no key). Use to skip send without throwing. */
export function isEmailEnabled(): boolean {
  return isEmailConfigured();
}

export async function sendRejectionEmail(
  to: string,
  candidateName: string,
  jobTitle: string
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn(
      "[Email] Skipping rejection email: RESEND_API_KEY not set. Get a key at https://resend.com"
    );
    return;
  }
  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Update on your application for ${jobTitle}`,
      html: `
      <h2>Hi ${candidateName},</h2>
      <p>Thank you for your interest in the <strong>${jobTitle}</strong> position and for taking the time to apply.</p>
      <p>After careful review, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.</p>
      <p>We encourage you to apply for future openings that match your skills. We wish you all the best in your career journey.</p>
      <p>Best regards,<br/>The Hiring Team</p>
    `,
    });
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  } catch (err) {
    console.error("[Email] sendRejectionEmail failed:", err);
    throw err;
  }
}

export async function sendMagicLinkEmail(
  to: string,
  token: string,
  name: string
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn(
      "[Email] Skipping magic link email: RESEND_API_KEY not set. Get a key at https://resend.com"
    );
    return;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const link = `${appUrl}/api/auth/verify-magic-link?token=${token}`;

  try {
    const { error } = await getResend().emails.send({
      from: FROM_EMAIL,
      to,
      subject: "Your HireFlow Login Link",
      html: `
      <h2>Hi ${name},</h2>
      <p>Click the link below to access your application dashboard:</p>
      <p><a href="${link}" style="display:inline-block;background:#2563eb;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Access Dashboard</a></p>
      <p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      <p>— HireFlow</p>
    `,
    });
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  } catch (err) {
    console.error("[Email] sendMagicLinkEmail failed:", err);
    throw err;
  }
}

export async function sendInterviewInvite(
  to: string,
  candidateName: string,
  jobTitle: string,
  roundName: string,
  scheduledAt: Date
): Promise<void> {
  if (!isEmailConfigured()) {
    console.warn(
      "[Email] Skipping interview invite email: RESEND_API_KEY not set. Get a key at https://resend.com"
    );
    return;
  }
  const dateStr = new Date(scheduledAt).toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  });

  try {
    const { error } = await getResend().emails.send({
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
    `,
    });
    if (error) {
      throw new Error(JSON.stringify(error));
    }
  } catch (err) {
    console.error("[Email] sendInterviewInvite failed:", err);
    throw err;
  }
}
