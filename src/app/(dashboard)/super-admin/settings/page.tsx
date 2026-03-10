import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SuperAdminSettingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const [tenantCount, userCount, jobCount] = await Promise.all([
    prisma.tenant.count(),
    prisma.user.count(),
    prisma.job.count(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="space-y-6 max-w-xl">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">
            Platform overview
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Quick stats used for monitoring. Full configuration (e.g. feature
            flags, defaults) can be added here later.
          </p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-gray-500">Tenants</dt>
            <dd className="font-medium text-gray-900">{tenantCount}</dd>
            <dt className="text-gray-500">Users</dt>
            <dd className="font-medium text-gray-900">{userCount}</dd>
            <dt className="text-gray-500">Total jobs</dt>
            <dd className="font-medium text-gray-900">{jobCount}</dd>
          </dl>
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Environment</h2>
          <p className="text-sm text-gray-600">
            API keys and secrets are configured via .env. Ensure{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">
              GEMINI_API_KEY
            </code>
            ,{" "}
            <code className="rounded bg-gray-100 px-1 text-xs">
              NEXTAUTH_SECRET
            </code>
            , and database URL are set for production.
          </p>
        </div>

        <p>
          <Link
            href="/super-admin"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Overview
          </Link>
        </p>
      </div>
    </div>
  );
}
