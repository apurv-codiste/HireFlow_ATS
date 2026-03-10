import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { HRSettingsForm } from "./settings-form";

export const dynamic = "force-dynamic";

export default async function HRSettingsPage() {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const tenantId = session.user.tenantId;
  if (!tenantId) redirect("/login");

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
        <p className="text-gray-600">Tenant not found.</p>
        <Link href="/hr" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Company</h2>
          <p className="text-sm text-gray-600 mb-4">
            Update your organization name shown across the app.
          </p>
          <HRSettingsForm tenantId={tenant.id} initialName={tenant.name} />
        </div>

        <p>
          <Link
            href="/hr"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
