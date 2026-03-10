import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeCV } from "@/lib/gemini";
import { sendRejectionEmail } from "@/lib/email";
import { sendDiscordAlert } from "@/lib/error-handler";
import { AI_SCORE_THRESHOLD } from "@/lib/constants";
import { AppStatus } from "@prisma/client";

export async function POST(req: Request) {
  try {
    // Verify internal secret
    const secret = req.headers.get("x-internal-secret");
    if (secret !== (process.env.INTERNAL_API_SECRET || "dev-secret")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { applicationId } = await req.json();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      );
    }

    if (!application.resumeData) {
      await sendDiscordAlert(
        `No resume data for application ${applicationId}`
      );
      return NextResponse.json(
        { error: "No resume data" },
        { status: 400 }
      );
    }

    // Analyze CV with Gemini
    const resumeBase64 = Buffer.from(application.resumeData).toString("base64");
    const mimeType = application.resumeMimeType || "application/pdf";

    const analysis = await analyzeCV(
      resumeBase64,
      mimeType,
      application.job.description
    );

    // Determine new status based on score
    let newStatus: AppStatus;
    if (analysis.score >= AI_SCORE_THRESHOLD.AUTO_APPROVE) {
      newStatus = "R1_PENDING";
    } else if (analysis.score >= AI_SCORE_THRESHOLD.WAITLIST) {
      newStatus = "WAITLIST";
    } else {
      newStatus = "REJECTED";
    }

    // Update application with AI results
    await prisma.$transaction([
      prisma.application.update({
        where: { id: applicationId },
        data: {
          aiScore: analysis.score,
          aiSummary: JSON.stringify(analysis),
          currentStatus: newStatus,
        },
      }),
      prisma.statusHistory.create({
        data: {
          applicationId,
          oldStatus: "PENDING_AI",
          newStatus,
        },
      }),
    ]);

    // Send rejection email if rejected
    if (newStatus === "REJECTED") {
      await sendRejectionEmail(
        application.candidate.email,
        application.candidate.name,
        application.job.title
      );
    }

    return NextResponse.json({
      success: true,
      score: analysis.score,
      status: newStatus,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("AI processing error:", error);
    await sendDiscordAlert(`AI Processing Failed: ${message}`);
    // Include detail in response for debugging (e.g. missing GEMINI_API_KEY)
    const isDev = process.env.NODE_ENV === "development";
    return NextResponse.json(
      { error: "AI processing failed", ...(isDev && { detail: message }) },
      { status: 500 }
    );
  }
}
