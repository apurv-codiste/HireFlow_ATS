import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [tenantCount, userCount, jobCount, applicationCount, recentTenants] =
    await Promise.all([
      prisma.tenant.count(),
      prisma.user.count(),
      prisma.job.count({ where: { status: "PUBLISHED" } }),
      prisma.application.count(),
      prisma.tenant.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { users: true, jobs: true } } },
      }),
    ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Platform Overview
      </h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard title="Total Tenants" value={tenantCount} />
        <StatCard title="Total Users" value={userCount} />
        <StatCard title="Active Jobs" value={jobCount} />
        <StatCard title="Applications" value={applicationCount} />
      </div>

      <div className="rounded-xl bg-white border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Tenants</h2>
        {recentTenants.length === 0 ? (
          <p className="text-gray-500 text-sm">No tenants yet.</p>
        ) : (
          <div className="space-y-3">
            {recentTenants.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{t.name}</p>
                  <p className="text-sm text-gray-500">
                    {t._count.users} users · {t._count.jobs} jobs
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  {formatDate(t.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
        <Link
          href="/super-admin/tenants"
          className="inline-block mt-4 text-sm text-blue-600 hover:underline"
        >
          View all tenants →
        </Link>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl bg-white border border-gray-200 p-5">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
