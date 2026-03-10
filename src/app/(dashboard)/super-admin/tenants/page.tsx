import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";
import { AddTenantForm } from "./add-tenant-form";

export const dynamic = "force-dynamic";

export default async function SuperAdminTenantsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");

  const [tenants, total] = await Promise.all([
    prisma.tenant.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { users: true, jobs: true } } },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.tenant.count(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
        <AddTenantForm />
      </div>

      {tenants.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">No tenants yet.</p>
          <Link
            href="/super-admin"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Overview
          </Link>
        </div>
      ) : (
        <>
          <div className="rounded-xl bg-white border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Name
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Users
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Jobs
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.id}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t._count.users}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {t._count.jobs}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {page > 1 && (
                <Link
                  href={`/super-admin/tenants?page=${page - 1}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/super-admin/tenants?page=${page + 1}`}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          )}

          <p className="mt-4">
            <Link
              href="/super-admin"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to Overview
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
