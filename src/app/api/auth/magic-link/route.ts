import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendMagicLinkEmail } from "@/lib/email";
import { z } from "zod";
import crypto from "crypto";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Find or create candidate user
    let user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name || "Candidate",
          role: "CANDIDATE",
        },
      });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { magicLinkToken: token, magicLinkExpiry: expiry },
    });

    await sendMagicLinkEmail(data.email, token, user.name);

    return NextResponse.json({ message: "Magic link sent" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid email" },
        { status: 400 }
      );
    }
    console.error("POST /api/auth/magic-link error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
