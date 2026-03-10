import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        tenant: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Verify tenant access
    if (
      session.user.role === "HR_ADMIN" &&
      job.tenantId !== session.user.tenantId
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("GET /api/jobs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HR_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.job.update({
      where: { id },
      data: {
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.department !== undefined && { department: body.department }),
        ...(body.budget !== undefined && { budget: body.budget }),
        ...(body.targetTimeline !== undefined && {
          targetTimeline: body.targetTimeline
            ? new Date(body.targetTimeline)
            : null,
        }),
        ...(body.status && { status: body.status }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/jobs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "HR_ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const job = await prisma.job.findUnique({ where: { id } });

    if (!job || job.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Soft close instead of delete
    await prisma.job.update({
      where: { id },
      data: { status: "CLOSED" },
    });

    return NextResponse.json({ message: "Job closed" });
  } catch (error) {
    console.error("DELETE /api/jobs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
