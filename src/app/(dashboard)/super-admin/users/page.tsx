import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { ITEMS_PER_PAGE } from "@/lib/constants";
import Link from "next/link";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  TEAM_MEMBER: "Team Member",
  CANDIDATE: "Candidate",
};

export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const roleFilter = params.role;

  const where: Record<string, unknown> = {};
  if (roleFilter) where.role = roleFilter;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: { tenant: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * ITEMS_PER_PAGE,
      take: ITEMS_PER_PAGE,
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users</h1>

      {/* Role filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/super-admin/users"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            !roleFilter
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </Link>
        {(["SUPER_ADMIN", "HR_ADMIN", "TEAM_MEMBER", "CANDIDATE"] as const).map(
          (r) => (
            <Link
              key={r}
              href={`/super-admin/users?role=${r}`}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                roleFilter === r
                  ? "bg-blue-100 text-blue-800"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {ROLE_LABELS[r]}
            </Link>
          )
        )}
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">No users found.</p>
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
                      Email
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Role
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Tenant
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-700">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {u.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {u.tenant?.name ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {formatDate(u.createdAt)}
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
                  href={`/super-admin/users?page=${page - 1}${roleFilter ? `&role=${roleFilter}` : ""}`}
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
                  href={`/super-admin/users?page=${page + 1}${roleFilter ? `&role=${roleFilter}` : ""}`}
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
