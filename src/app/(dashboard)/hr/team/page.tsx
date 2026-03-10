import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { InviteForm } from "./invite-form";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const session = await getSession();
  if (!session || session.user.role !== "HR_ADMIN") redirect("/login");

  const teamMembers = await prisma.user.findMany({
    where: { tenantId: session.user.tenantId!, role: "TEAM_MEMBER" },
    include: {
      _count: { select: { interviews: true } },
      interviews: {
        where: { passed: null },
        select: { id: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Team Members</h1>
      </div>

      <InviteForm />

      {teamMembers.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No team members yet. Invite one above.
        </p>
      ) : (
        <div className="space-y-3 mt-6">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="rounded-xl bg-white border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {member._count.interviews} total interviews
                  </p>
                  <p className="text-xs text-amber-600">
                    {member.interviews.length} pending
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Joined {formatDate(member.createdAt)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
