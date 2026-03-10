import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
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

    const updated = await prisma.job.update({
      where: { id },
      data: { status: "PUBLISHED" },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("POST /api/jobs/[id]/publish error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
