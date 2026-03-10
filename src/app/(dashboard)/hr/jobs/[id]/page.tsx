import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ITEMS_PER_PAGE, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import Link from "next/link";
import { JobActions } from "./job-actions";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const page = parseInt(sp.page || "1");
  const statusFilter = sp.status;

  const job = await prisma.job.findUnique({
    where: { id },
    include: { tenant: { select: { name: true } } },
  });

  if (!job || job.tenantId !== session.user.tenantId) notFound();

  const appWhere: Record<string, unknown> = { jobId: id };
  if (statusFilter) appWhere.currentStatus = statusFilter;

  const [applications, total] = await Promise.all([
    prisma.application.findMany({
      where: appWhere,
      include: {
        candidate: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.application.count({ where: appWhere }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = `${appUrl}/jobs/${job.shareableSlug}`;

  return (
    <div>
      <Link
        href="/hr/jobs"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Jobs
      </Link>

      <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            <p className="text-gray-500 mt-1">
              {job.department || "No department"}
              {job.budget && ` · ${job.budget}`}
            </p>
          </div>
          <JobActions jobId={job.id} status={job.status} shareUrl={shareUrl} />
        </div>

        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap mb-4">
          {job.description.slice(0, 500)}
          {job.description.length > 500 && "..."}
        </div>

        <div className="flex gap-4 text-sm text-gray-400">
          <span>Created {formatDate(job.createdAt)}</span>
          {job.targetTimeline && (
            <span>Target: {formatDate(job.targetTimeline)}</span>
          )}
          <span>{total} applications</span>
        </div>
      </div>

      {/* Applications */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Applications ({total})
      </h2>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { label: "All", value: "" },
          { label: "AI Pending", value: "PENDING_AI" },
          { label: "R1", value: "R1_PENDING" },
          { label: "R2", value: "R2_PENDING" },
          { label: "R3", value: "R3_PENDING" },
          { label: "Hired", value: "HIRED" },
          { label: "Rejected", value: "REJECTED" },
        ].map((tab) => (
          <Link
            key={tab.value}
            href={`/hr/jobs/${id}${tab.value ? `?status=${tab.value}` : ""}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap ${
              (statusFilter || "") === tab.value
                ? "bg-blue-100 text-blue-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {applications.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No applications found.</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <Link
              key={app.id}
              href={`/hr/applications/${app.id}`}
              className="block rounded-xl bg-white border border-gray-200 p-4 hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {app.candidate.name}
                  </p>
                  <p className="text-sm text-gray-500">{app.candidate.email}</p>
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
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/hr/jobs/${id}?page=${page - 1}`}
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
              href={`/hr/jobs/${id}?page=${page + 1}`}
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
