import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { z } from "zod";
import { AppStatus } from "@prisma/client";

const feedbackSchema = z.object({
  passed: z.boolean(),
  feedback: z.string().min(1),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== "TEAM_MEMBER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = feedbackSchema.parse(body);

    const interview = await prisma.interview.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!interview) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (interview.interviewerId !== session.user.id) {
      return NextResponse.json(
        { error: "Not your interview" },
        { status: 403 }
      );
    }

    if (interview.passed !== null) {
      return NextResponse.json(
        { error: "Feedback already submitted" },
        { status: 409 }
      );
    }

    // Determine next status based on round and pass/fail
    let newStatus: AppStatus = interview.application.currentStatus;

    if (data.passed) {
      if (interview.roundName === "R1 Tech") {
        newStatus = "R2_PENDING";
      } else if (interview.roundName === "R2 HR") {
        newStatus = "R3_PENDING";
      } else if (interview.roundName === "R3 Final") {
        newStatus = "HIRED";
      } else {
        // Mark current round as done
        const currentStatus = interview.application.currentStatus;
        if (currentStatus.startsWith("R1")) newStatus = "R1_DONE";
        else if (currentStatus.startsWith("R2")) newStatus = "R2_DONE";
        else if (currentStatus.startsWith("R3")) newStatus = "R3_DONE";
      }
    } else {
      newStatus = "REJECTED";
    }

    // Update interview, application status, and log history
    await prisma.$transaction([
      prisma.interview.update({
        where: { id },
        data: { passed: data.passed, feedback: data.feedback },
      }),
      prisma.application.update({
        where: { id: interview.applicationId },
        data: { currentStatus: newStatus },
      }),
      prisma.statusHistory.create({
        data: {
          applicationId: interview.applicationId,
          oldStatus: interview.application.currentStatus,
          newStatus,
          changedById: session.user.id,
        },
      }),
    ]);

    // Send rejection email if failed
    if (!data.passed) {
      const application = await prisma.application.findUnique({
        where: { id: interview.applicationId },
        include: { candidate: true, job: true },
      });
      if (application) {
        import("@/lib/email").then(({ sendRejectionEmail }) => {
          sendRejectionEmail(
            application.candidate.email,
            application.candidate.name,
            application.job.title
          ).catch(console.error);
        });
      }
    }

    return NextResponse.json({ success: true, newStatus });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("POST /api/interviews/[id]/feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
