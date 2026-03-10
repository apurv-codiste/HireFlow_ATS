import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";

const assignSchema = z.object({
  interviewerId: z.string().uuid(),
  roundName: z.string().min(1),
  scheduledAt: z.string().optional(),
});

export async function POST(
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
    const data = assignSchema.parse(body);

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true, candidate: true },
    });

    if (!application || application.job.tenantId !== session.user.tenantId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Verify interviewer belongs to same tenant
    const interviewer = await prisma.user.findUnique({
      where: { id: data.interviewerId },
    });

    if (!interviewer || interviewer.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Interviewer not found" },
        { status: 404 }
      );
    }

    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

    // Create interview and update application status
    const roundStatusMap: Record<string, string> = {
      "R1 Tech": scheduledAt ? "R1_SCHEDULED" : "R1_PENDING",
      "R2 HR": scheduledAt ? "R2_SCHEDULED" : "R2_PENDING",
      "R3 Final": scheduledAt ? "R3_SCHEDULED" : "R3_PENDING",
    };

    const newStatus = roundStatusMap[data.roundName] || application.currentStatus;

    const [interview] = await prisma.$transaction([
      prisma.interview.create({
        data: {
          applicationId: id,
          interviewerId: data.interviewerId,
          roundName: data.roundName,
          scheduledAt,
        },
      }),
      prisma.application.update({
        where: { id },
        data: { currentStatus: newStatus as never },
      }),
      prisma.statusHistory.create({
        data: {
          applicationId: id,
          oldStatus: application.currentStatus,
          newStatus: newStatus as never,
          changedById: session.user.id,
        },
      }),
    ]);

    // Send interview invite email
    if (scheduledAt) {
      import("@/lib/email").then(({ sendInterviewInvite }) => {
        sendInterviewInvite(
          application.candidate.email,
          application.candidate.name,
          application.job.title,
          data.roundName,
          scheduledAt
        ).catch(console.error);
      });
    }

    return NextResponse.json(interview, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/applications/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
