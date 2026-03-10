import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PIPELINE_STAGES = [
  "PENDING_AI",
  "R1_PENDING",
  "R2_PENDING",
  "R3_PENDING",
  "HIRED",
];

export default async function CandidateDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "CANDIDATE") redirect("/login");

  const applications = await prisma.application.findMany({
    where: { candidateId: session.user.id },
    include: {
      job: {
        select: { title: true, department: true, tenant: { select: { name: true } } },
      },
      statusHistories: { orderBy: { changedAt: "asc" } },
      interviews: {
        select: { roundName: true, scheduledAt: true, passed: true },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        My Applications
      </h1>

      {applications.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 mb-4">
            You haven&apos;t applied to any positions yet.
          </p>
          <Link
            href="/jobs"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Browse Open Positions
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl bg-white border border-gray-200 p-5"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {app.job.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {app.job.tenant.name}
                    {app.job.department && ` · ${app.job.department}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Applied {formatDate(app.createdAt)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_COLORS[app.currentStatus]}`}
                >
                  {STATUS_LABELS[app.currentStatus]}
                </span>
              </div>

              {/* Status Pipeline */}
              {app.currentStatus !== "REJECTED" && (
                <div className="mb-4">
                  <div className="flex items-center gap-1">
                    {PIPELINE_STAGES.map((stage, i) => {
                      const stageIndex = PIPELINE_STAGES.indexOf(
                        getCurrentStageGroup(app.currentStatus)
                      );
                      const isCompleted = i < stageIndex;
                      const isCurrent = i === stageIndex;

                      return (
                        <div key={stage} className="flex items-center flex-1">
                          <div
                            className={`h-2 w-full rounded-full ${
                              isCompleted
                                ? "bg-green-500"
                                : isCurrent
                                  ? "bg-blue-500"
                                  : "bg-gray-200"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-400">AI Review</span>
                    <span className="text-xs text-gray-400">Round 1</span>
                    <span className="text-xs text-gray-400">Round 2</span>
                    <span className="text-xs text-gray-400">Round 3</span>
                    <span className="text-xs text-gray-400">Hired</span>
                  </div>
                </div>
              )}

              {/* AI Score */}
              {app.aiScore && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <span className="font-medium">AI Match Score:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-3 w-3 rounded-full ${
                          n <= app.aiScore!
                            ? "bg-blue-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span>{app.aiScore}/5</span>
                </div>
              )}

              {/* Upcoming Interview */}
              {app.interviews
                .filter((i) => i.passed === null && i.scheduledAt)
                .map((interview, idx) => (
                  <div
                    key={idx}
                    className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm"
                  >
                    <p className="font-medium text-blue-800">
                      {interview.roundName} scheduled
                    </p>
                    <p className="text-blue-600">
                      {interview.scheduledAt &&
                        formatDate(interview.scheduledAt)}
                    </p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getCurrentStageGroup(status: string): string {
  if (status === "PENDING_AI" || status === "WAITLIST") return "PENDING_AI";
  if (status.startsWith("R1")) return "R1_PENDING";
  if (status.startsWith("R2")) return "R2_PENDING";
  if (status.startsWith("R3")) return "R3_PENDING";
  if (status === "HIRED") return "HIRED";
  return "PENDING_AI";
}
