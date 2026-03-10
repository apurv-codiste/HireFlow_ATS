import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PUBLISHED: "bg-green-100 text-green-700",
  CLOSED: "bg-red-100 text-red-700",
};

export default async function HRJobsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const statusFilter = params.status;

  const where: Record<string, unknown> = {
    tenantId: session.user.tenantId,
  };
  if (statusFilter) where.status = statusFilter;

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <Link
          href="/hr/jobs/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Create Job
        </Link>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { label: "All", value: "" },
          { label: "Draft", value: "DRAFT" },
          { label: "Published", value: "PUBLISHED" },
          { label: "Closed", value: "CLOSED" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/hr/jobs${tab.value ? `?status=${tab.value}` : ""}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium whitespace-nowrap ${
              (statusFilter || "") === tab.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {jobs.length === 0 ? (
        <p className="text-gray-500 text-center py-12">No jobs found.</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/hr/jobs/${job.id}`}
              className="block rounded-xl bg-white border border-gray-200 p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{job.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.department || "No department"}
                    {job.budget && ` · ${job.budget}`}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[job.status]}`}
                >
                  {job.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                <span>{job._count.applications} applications</span>
                <span>Created {formatDate(job.createdAt)}</span>
                {job.targetTimeline && (
                  <span>Target: {formatDate(job.targetTimeline)}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={`/hr/jobs?page=${page - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
              href={`/hr/jobs?page=${page + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
