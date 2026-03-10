import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/login?error=invalid-token", req.url)
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        magicLinkToken: token,
        magicLinkExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      return NextResponse.redirect(
        new URL("/login?error=expired-token", req.url)
      );
    }

    // Clear magic link token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        magicLinkToken: null,
        magicLinkExpiry: null,
        emailVerified: new Date(),
      },
    });

    // Redirect to login with pre-filled email
    // The user will need to use Google OAuth or get a new magic link
    // In production, you'd create a session directly here
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return NextResponse.redirect(
      `${appUrl}/candidate?verified=true&email=${encodeURIComponent(user.email)}`
    );
  } catch (error) {
    console.error("GET /api/auth/verify-magic-link error:", error);
    return NextResponse.redirect(
      new URL("/login?error=server-error", req.url)
    );
  }
}
