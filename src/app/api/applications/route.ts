import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { z } from "zod";

const applySchema = z.object({
  jobId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  resumeData: z.string().min(1), // base64
  resumeMimeType: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const status = searchParams.get("status");
    const jobId = searchParams.get("jobId");

    const where: Record<string, unknown> = {};

    if (session.user.role === "CANDIDATE") {
      where.candidateId = session.user.id;
    } else if (session.user.role === "HR_ADMIN" && session.user.tenantId) {
      where.job = { tenantId: session.user.tenantId };
    } else if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status) where.currentStatus = status;
    if (jobId) where.jobId = jobId;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where,
        include: {
          candidate: { select: { id: true, name: true, email: true } },
          job: { select: { id: true, title: true, department: true, tenant: { select: { name: true } } } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.application.count({ where }),
    ]);

    return NextResponse.json({
      applications,
      total,
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    console.error("GET /api/applications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = applySchema.parse(body);

    // Find the job
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job || job.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Job not found or not accepting applications" },
        { status: 404 }
      );
    }

    // Find or create candidate user
    let candidate = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!candidate) {
      candidate = await prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          role: "CANDIDATE",
        },
      });
    }

    // Check for duplicate application
    const existing = await prisma.application.findFirst({
      where: {
        jobId: data.jobId,
        candidateId: candidate.id,
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You have already applied for this position" },
        { status: 409 }
      );
    }

    // Create application
    const resumeBuffer = Buffer.from(data.resumeData, "base64");

    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        candidateId: candidate.id,
        resumeData: resumeBuffer,
        resumeMimeType: data.resumeMimeType || "application/pdf",
        currentStatus: "PENDING_AI",
        statusHistories: {
          create: {
            newStatus: "PENDING_AI",
            changedById: candidate.id,
          },
        },
      },
    });

    // Trigger AI processing asynchronously
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    fetch(`${appUrl}/api/internal/process-ai`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "dev-secret",
      },
      body: JSON.stringify({ applicationId: application.id }),
    }).catch((err) => {
      console.error("Failed to trigger AI processing:", err);
    });

    // Send magic link email for candidate to track application
    const crypto = await import("crypto");
    const token = crypto.randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: candidate.id },
      data: { magicLinkToken: token, magicLinkExpiry: expiry },
    });

    // Send email asynchronously (don't block response)
    import("@/lib/email").then(({ sendMagicLinkEmail }) => {
      sendMagicLinkEmail(data.email, token, data.name).catch(console.error);
    });

    return NextResponse.json(
      { id: application.id, status: "PENDING_AI" },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/applications error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
