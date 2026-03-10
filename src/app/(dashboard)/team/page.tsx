import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TeamDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "TEAM_MEMBER") redirect("/login");

  const now = new Date();

  const [upcoming, pendingFeedback, completed] = await Promise.all([
    prisma.interview.findMany({
      where: {
        interviewerId: session.user.id,
        scheduledAt: { gt: now },
        passed: null,
      },
      include: {
        application: {
          include: {
            candidate: { select: { name: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.interview.findMany({
      where: {
        interviewerId: session.user.id,
        OR: [{ scheduledAt: { lte: now } }, { scheduledAt: null }],
        passed: null,
      },
      include: {
        application: {
          include: {
            candidate: { select: { name: true, email: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.interview.findMany({
      where: {
        interviewerId: session.user.id,
        passed: { not: null },
      },
      include: {
        application: {
          include: {
            candidate: { select: { name: true } },
            job: { select: { title: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 10,
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Interviews</h1>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard title="Upcoming" value={upcoming.length} />
        <StatCard
          title="Pending Feedback"
          value={pendingFeedback.length}
          color="amber"
        />
        <StatCard title="Completed" value={completed.length} color="green" />
      </div>

      {/* Pending Feedback - Priority */}
      {pendingFeedback.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">
            Pending Feedback
          </h2>
          <div className="space-y-3">
            {pendingFeedback.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                showFeedback
              />
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <section className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">
            Upcoming Interviews
          </h2>
          <div className="space-y-3">
            {upcoming.map((interview) => (
              <InterviewCard key={interview.id} interview={interview} />
            ))}
          </div>
        </section>
      )}

      {/* Completed */}
      {completed.length > 0 && (
        <section>
          <h2 className="font-semibold text-gray-900 mb-3">
            Recently Completed
          </h2>
          <div className="space-y-3">
            {completed.map((interview) => (
              <div
                key={interview.id}
                className="rounded-xl bg-white border border-gray-200 p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {interview.application.candidate.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {interview.application.job.title} ·{" "}
                      {interview.roundName}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      interview.passed
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {interview.passed ? "Passed" : "Failed"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {upcoming.length === 0 &&
        pendingFeedback.length === 0 &&
        completed.length === 0 && (
          <p className="text-gray-500 text-center py-12">
            No interviews assigned yet.
          </p>
        )}
    </div>
  );
}

function InterviewCard({
  interview,
  showFeedback = false,
}: {
  interview: {
    id: string;
    roundName: string;
    scheduledAt: Date | null;
    application: {
      candidate: { name: string; email: string };
      job: { title: string };
    };
  };
  showFeedback?: boolean;
}) {
  return (
    <Link
      href={`/team/interview/${interview.id}`}
      className={`block rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow ${
        showFeedback ? "border-amber-200 bg-amber-50" : "border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">
            {interview.application.candidate.name}
          </p>
          <p className="text-sm text-gray-500">
            {interview.application.job.title} · {interview.roundName}
          </p>
        </div>
        <div className="text-right">
          {interview.scheduledAt && (
            <p className="text-sm text-gray-600">
              {formatDate(interview.scheduledAt)}
            </p>
          )}
          {showFeedback && (
            <span className="text-xs font-medium text-amber-600">
              Feedback needed
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

function StatCard({
  title,
  value,
  color = "default",
}: {
  title: string;
  value: number;
  color?: string;
}) {
  const colors: Record<string, string> = {
    default: "text-gray-900",
    amber: "text-amber-600",
    green: "text-green-600",
  };
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colors[color]}`}>{value}</p>
    </div>
  );
}
