import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { generateSlug } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import { z } from "zod";

const createJobSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  department: z.string().optional(),
  budget: z.string().optional(),
  targetTimeline: z.string().optional(),
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

    const where: Record<string, unknown> = {};

    if (session.user.role === "HR_ADMIN" && session.user.tenantId) {
      where.tenantId = session.user.tenantId;
    } else if (session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (status) {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          _count: { select: { applications: true } },
          tenant: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * ITEMS_PER_PAGE,
        take: ITEMS_PER_PAGE,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      total,
      page,
      totalPages: Math.ceil(total / ITEMS_PER_PAGE),
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HR_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!session.user.tenantId) {
      return NextResponse.json(
        { error: "No tenant assigned" },
        { status: 400 }
      );
    }

    const body = await req.json();
    const data = createJobSchema.parse(body);

    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        department: data.department,
        budget: data.budget,
        targetTimeline: data.targetTimeline
          ? new Date(data.targetTimeline)
          : null,
        shareableSlug: generateSlug(data.title),
        tenantId: session.user.tenantId,
        status: "DRAFT",
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
