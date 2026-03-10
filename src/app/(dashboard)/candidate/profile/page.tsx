import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import { CandidateProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";

export default async function CandidateProfilePage() {
  const session = await getSession();
  if (!session || session.user.role !== "CANDIDATE") redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { applications: true } },
    },
  });

  if (!user) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
        <p className="text-gray-600">User not found.</p>
        <Link href="/candidate" className="mt-4 inline-block text-sm text-blue-600 hover:underline">
          ← Back to My Applications
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Your details</h2>
          <p className="text-sm text-gray-600 mb-4">
            Update your display name. Email is used for login and cannot be changed here.
          </p>
          <CandidateProfileForm initialName={user.name} />
        </div>

        <div className="rounded-xl bg-white border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-900 mb-3">Account</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd className="font-medium text-gray-900">{user.email}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Applications</dt>
              <dd className="font-medium text-gray-900">{user._count.applications}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Member since</dt>
              <dd className="font-medium text-gray-900">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </div>

        <p>
          <Link
            href="/candidate"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to My Applications
          </Link>
        </p>
      </div>
    </div>
  );
}
