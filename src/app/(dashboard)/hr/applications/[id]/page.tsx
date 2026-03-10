import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, daysBetween } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { ApplicationActions } from "./application-actions";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const { id } = await params;

  const application = await prisma.application.findUnique({
    where: { id },
    include: {
      candidate: { select: { id: true, name: true, email: true, image: true } },
      job: {
        select: { id: true, title: true, department: true, tenantId: true },
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

  if (!application || application.job.tenantId !== session.user.tenantId) {
    notFound();
  }

  // Parse AI summary
  let aiAnalysis = null;
  if (application.aiSummary) {
    try {
      aiAnalysis = JSON.parse(application.aiSummary);
    } catch {
      aiAnalysis = { summary: application.aiSummary };
    }
  }

  // Get team members for assignment
  const teamMembers = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId!, role: "TEAM_MEMBER" },
    select: { id: true, name: true, email: true },
  });

  return (
    <div>
      <Link
        href="/hr/applications"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Applications
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Candidate Info */}
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {application.candidate.name}
                </h1>
                <p className="text-gray-500">{application.candidate.email}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Applied for{" "}
                  <Link
                    href={`/hr/jobs/${application.job.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {application.job.title}
                  </Link>
                  {" · "}
                  {formatDate(application.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-sm font-medium ${STATUS_COLORS[application.currentStatus]}`}
              >
                {STATUS_LABELS[application.currentStatus]}
              </span>
            </div>

            <ApplicationActions
              applicationId={application.id}
              currentStatus={application.currentStatus}
              teamMembers={teamMembers}
            />
          </div>

          {/* AI Analysis */}
          {aiAnalysis && (
            <div className="rounded-xl bg-white border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                AI Analysis
              </h2>
              {application.aiScore && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Match Score:
                  </span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-4 w-4 rounded-full ${
                          n <= application.aiScore!
                            ? "bg-blue-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-blue-600">
                    {application.aiScore}/5
                  </span>
                </div>
              )}
              {aiAnalysis.summary && (
                <p className="text-sm text-gray-700 mb-4">
                  {aiAnalysis.summary}
                </p>
              )}
              {aiAnalysis.keySkills && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Key Skills
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {aiAnalysis.keySkills.map((skill: string, i: number) => (
                      <span
                        key={i}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {aiAnalysis.matchReasons && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Match Reasons
                  </p>
                  <ul className="text-sm text-gray-600 list-disc list-inside">
                    {aiAnalysis.matchReasons.map(
                      (r: string, i: number) => (
                        <li key={i}>{r}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
              {aiAnalysis.concerns && aiAnalysis.concerns.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">
                    Concerns
                  </p>
                  <ul className="text-sm text-amber-700 list-disc list-inside">
                    {aiAnalysis.concerns.map((c: string, i: number) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Interview History */}
          {application.interviews.length > 0 && (
            <div className="rounded-xl bg-white border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-3">
                Interviews
              </h2>
              <div className="space-y-4">
                {application.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="border-l-2 border-gray-200 pl-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.roundName}
                        </p>
                        <p className="text-sm text-gray-500">
                          Interviewer: {interview.interviewer?.name || "Unassigned"}
                        </p>
                        {interview.scheduledAt && (
                          <p className="text-sm text-gray-400">
                            {formatDate(interview.scheduledAt)}
                          </p>
                        )}
                      </div>
                      {interview.passed !== null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            interview.passed
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {interview.passed ? "Passed" : "Failed"}
                        </span>
                      )}
                    </div>
                    {interview.feedback && (
                      <p className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2">
                        {interview.feedback}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Status Timeline */}
        <div>
          <div className="rounded-xl bg-white border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Status Timeline
            </h2>
            <div className="space-y-4">
              {application.statusHistories.map((history, i) => {
                const nextHistory = application.statusHistories[i + 1];
                const duration = nextHistory
                  ? daysBetween(
                      new Date(history.changedAt),
                      new Date(nextHistory.changedAt)
                    )
                  : null;

                return (
                  <div key={history.id} className="relative pl-6">
                    <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-blue-500" />
                    {i < application.statusHistories.length - 1 && (
                      <div className="absolute left-1.5 top-4 w-px h-full -bottom-2 bg-gray-200" />
                    )}
                    <p className="text-sm font-medium text-gray-900">
                      {STATUS_LABELS[history.newStatus] || history.newStatus}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDate(history.changedAt)}
                    </p>
                    {duration !== null && duration > 0 && (
                      <p className="text-xs text-gray-400 mt-1">
                        {duration} day{duration !== 1 ? "s" : ""} in this stage
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
