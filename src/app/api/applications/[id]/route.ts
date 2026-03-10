import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { AppStatus } from "@prisma/client";

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
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        candidate: { select: { id: true, name: true, email: true, image: true } },
        job: {
          select: {
            id: true,
            title: true,
            department: true,
            description: true,
            tenant: { select: { name: true } },
          },
        },
        statusHistories: { orderBy: { changedAt: "asc" } },
        interviews: {
          include: {
            interviewer: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Access control
    if (
      session.user.role === "CANDIDATE" &&
      application.candidateId !== session.user.id
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error("GET /api/applications/[id] error:", error);
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
    const body = await req.json();
    const { status: newStatus } = body;

    if (!newStatus || !Object.values(AppStatus).includes(newStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true },
    });

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (application.job.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update status and create history entry
    const [updated] = await prisma.$transaction([
      prisma.application.update({
        where: { id },
        data: { currentStatus: newStatus },
      }),
      prisma.statusHistory.create({
        data: {
          applicationId: id,
          oldStatus: application.currentStatus,
          newStatus,
          changedById: session.user.id,
        },
      }),
    ]);

    // Send rejection email if rejected
    if (newStatus === "REJECTED") {
      const candidate = await prisma.user.findUnique({
        where: { id: application.candidateId },
      });
      if (candidate) {
        import("@/lib/email").then(({ sendRejectionEmail }) => {
          sendRejectionEmail(
            candidate.email,
            candidate.name,
            application.job.title
          ).catch(console.error);
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/applications/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
