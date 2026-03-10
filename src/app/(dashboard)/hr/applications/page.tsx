import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, daysBetween } from "@/lib/utils";
import { ITEMS_PER_PAGE, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HRApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    status?: string;
    jobId?: string;
    search?: string;
  }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const where: Record<string, unknown> = {
    job: { tenantId: session.user.tenantId },
  };

  if (params.status) where.currentStatus = params.status;
  if (params.jobId) where.jobId = params.jobId;
  if (params.search) {
    where.candidate = {
      OR: [
        { name: { contains: params.search, mode: "insensitive" } },
        { email: { contains: params.search, mode: "insensitive" } },
      ],
    };
  }

  const [applications, total, jobs] = await Promise.all([
    prisma.application.findMany({
      where,
      include: {
        candidate: { select: { name: true, email: true } },
        job: { select: { id: true, title: true } },
        statusHistories: { orderBy: { changedAt: "desc" }, take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.application.count({ where }),
    prisma.job.findMany({
      where: { tenantId: session.user.tenantId! },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        All Applications ({total})
      </h1>

      {/* Filters */}
      <form className="flex flex-wrap gap-3 mb-6">
        <input
          name="search"
          type="text"
          defaultValue={params.search}
          placeholder="Search candidate..."
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm w-full sm:w-64 focus:border-blue-500 focus:outline-none"
        />
        <select
          name="status"
          defaultValue={params.status}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {Object.entries(STATUS_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="jobId"
          defaultValue={params.jobId}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">All Jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Filter
        </button>
      </form>

      {applications.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No applications found.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {applications.map((app) => {
            const lastChange =
              app.statusHistories[0]?.changedAt || app.createdAt;
            const daysInStage = daysBetween(new Date(lastChange), new Date());

            return (
              <Link
                key={app.id}
                href={`/hr/applications/${app.id}`}
                className="block rounded-xl bg-white border border-gray-200 p-4 hover:shadow-sm"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {app.candidate.name}
                    </p>
                    <p className="text-sm text-gray-500">{app.job.title}</p>
                  </div>
                  {app.aiScore && (
                    <span className="text-lg font-bold text-blue-600">
                      {app.aiScore}/5
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[app.currentStatus]}`}
                  >
                    {STATUS_LABELS[app.currentStatus]}
                  </span>
                  <span className="text-xs text-gray-400">
                    {daysInStage}d in stage · {formatDate(app.createdAt)}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/hr/applications?page=${page - 1}`}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/hr/applications?page=${page + 1}`}
              className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
            >
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
