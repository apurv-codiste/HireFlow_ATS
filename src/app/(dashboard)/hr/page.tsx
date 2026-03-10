import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, daysBetween } from "@/lib/utils";
import { STATUS_COLORS, STATUS_LABELS, BOTTLENECK_DAYS } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HRDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const [
    activeJobs,
    totalApplications,
    pendingAI,
    r1Count,
    r2Count,
    r3Count,
    hiredCount,
    recentApplications,
    bottleneckCandidates,
  ] = await Promise.all([
    prisma.job.count({ where: { tenantId, status: "PUBLISHED" } }),
    prisma.application.count({ where: { job: { tenantId } } }),
    prisma.application.count({
      where: { job: { tenantId }, currentStatus: "PENDING_AI" },
    }),
    prisma.application.count({
      where: {
        job: { tenantId },
        currentStatus: { in: ["R1_PENDING", "R1_SCHEDULED", "R1_DONE"] },
      },
    }),
    prisma.application.count({
      where: {
        job: { tenantId },
        currentStatus: { in: ["R2_PENDING", "R2_SCHEDULED", "R2_DONE"] },
      },
    }),
    prisma.application.count({
      where: {
        job: { tenantId },
        currentStatus: { in: ["R3_PENDING", "R3_SCHEDULED", "R3_DONE"] },
      },
    }),
    prisma.application.count({
      where: { job: { tenantId }, currentStatus: "HIRED" },
    }),
    prisma.application.findMany({
      where: { job: { tenantId } },
      include: {
        candidate: { select: { name: true, email: true } },
        job: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    // Find bottleneck candidates (stuck > N days)
    prisma.application.findMany({
      where: {
        job: { tenantId },
        currentStatus: {
          in: ["R1_PENDING", "R2_PENDING", "R3_PENDING", "WAITLIST"],
        },
      },
      include: {
        candidate: { select: { name: true } },
        job: { select: { title: true } },
        statusHistories: {
          orderBy: { changedAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const bottlenecks = bottleneckCandidates.filter((app) => {
    const lastChange = app.statusHistories[0]?.changedAt || app.createdAt;
    return daysBetween(new Date(lastChange), new Date()) >= BOTTLENECK_DAYS;
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">HR Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <Link href="/hr/jobs">
          <StatCard title="Active Jobs" value={activeJobs} />
        </Link>
        <Link href="/hr/applications">
          <StatCard title="Total Applications" value={totalApplications} />
        </Link>
        <StatCard title="In Round 1" value={r1Count} />
        <StatCard title="Hired" value={hiredCount} color="green" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        <StatCard title="AI Pending" value={pendingAI} color="yellow" />
        <StatCard title="In Round 2" value={r2Count} />
        <StatCard title="In Round 3" value={r3Count} />
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div className="mb-8">
          <h2 className="font-semibold text-gray-900 mb-3">
            Bottleneck Alerts
          </h2>
          <div className="space-y-3">
            {bottlenecks.map((app) => {
              const lastChange =
                app.statusHistories[0]?.changedAt || app.createdAt;
              const days = daysBetween(new Date(lastChange), new Date());
              return (
                <Link
                  key={app.id}
                  href={`/hr/applications/${app.id}`}
                  className={`block rounded-xl border-l-4 bg-white p-4 shadow-sm ${
                    days > 7
                      ? "border-red-500"
                      : "border-amber-500"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {app.candidate.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {app.job.title} ·{" "}
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.currentStatus]}`}
                        >
                          {STATUS_LABELS[app.currentStatus]}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        days > 7 ? "text-red-600" : "text-amber-600"
                      }`}
                    >
                      {days} days stuck
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Applications */}
      <div className="rounded-xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">
          Recent Applications
        </h2>
        <div className="space-y-3">
          {recentApplications.map((app) => (
            <Link
              key={app.id}
              href={`/hr/applications/${app.id}`}
              className="flex items-center justify-between py-2 border-b last:border-0 hover:bg-gray-50 rounded px-2 -mx-2"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {app.candidate.name}
                </p>
                <p className="text-sm text-gray-500">{app.job.title}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.currentStatus]}`}
                >
                  {STATUS_LABELS[app.currentStatus]}
                </span>
                {app.aiScore && (
                  <p className="text-sm text-gray-500 mt-1">
                    AI: {app.aiScore}/5
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
        <Link
          href="/hr/applications"
          className="inline-block mt-4 text-sm text-blue-600 hover:underline"
        >
          View all applications →
        </Link>
      </div>
    </div>
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
  const colorMap: Record<string, string> = {
    default: "text-gray-900",
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-3xl font-bold mt-1 ${colorMap[color] || colorMap.default}`}>
        {value}
      </p>
    </div>
  );
}
