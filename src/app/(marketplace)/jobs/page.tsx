import Link from "next/link";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const search = params.search || "";
  const perPage = 15;

  const where = {
    status: "PUBLISHED" as const,
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { department: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [jobs, total] = await Promise.all([
    prisma.job.findMany({
      where,
      select: {
        id: true,
        title: true,
        department: true,
        budget: true,
        shareableSlug: true,
        createdAt: true,
        tenant: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.job.count({ where }),
  ]);

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-4 md:px-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <Link href="/" className="text-xl font-bold text-blue-600">
            HireFlow
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Open Positions
        </h1>
        <p className="text-gray-600 mb-6">
          {total} position{total !== 1 ? "s" : ""} available
        </p>

        {/* Search */}
        <form className="mb-6">
          <input
            name="search"
            type="text"
            defaultValue={search}
            placeholder="Search by title or department..."
            className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </form>

        {/* Job Cards */}
        {jobs.length === 0 ? (
          <p className="text-gray-500 py-12 text-center">
            No open positions found.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.shareableSlug}`}
                className="block rounded-xl border border-gray-200 bg-white p-5 hover:shadow-md transition-shadow"
              >
                <h2 className="font-semibold text-gray-900">{job.title}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {job.tenant.name}
                  {job.department && ` · ${job.department}`}
                </p>
                {job.budget && (
                  <p className="text-sm text-green-600 mt-2 font-medium">
                    Budget: {job.budget}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-3">
                  {job._count.applications} applicant
                  {job._count.applications !== 1 ? "s" : ""} ·{" "}
                  {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/jobs?page=${page - 1}${search ? `&search=${search}` : ""}`}
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
                href={`/jobs?page=${page + 1}${search ? `&search=${search}` : ""}`}
                className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-100"
              >
                Next
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
