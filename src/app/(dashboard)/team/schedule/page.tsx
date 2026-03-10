import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatTime(date: Date) {
  return new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function TeamSchedulePage() {
  const session = await getSession();
  if (!session || session.user.role !== "TEAM_MEMBER") redirect("/login");

  const interviews = await prisma.interview.findMany({
    where: {
      interviewerId: session.user.id,
      scheduledAt: { not: null },
    },
    include: {
      application: {
        include: {
          candidate: { select: { name: true, email: true } },
          job: { select: { title: true } },
        },
      },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const byDate = interviews.reduce<Record<string, typeof interviews>>(
    (acc, i) => {
      const d = i.scheduledAt
        ? new Date(i.scheduledAt).toISOString().slice(0, 10)
        : "no-date";
      if (!acc[d]) acc[d] = [];
      acc[d].push(i);
      return acc;
    },
    {}
  );

  const sortedDates = Object.keys(byDate).sort();
  if (sortedDates[0] === "no-date") {
    sortedDates.shift();
    if (byDate["no-date"]) sortedDates.push("no-date");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Schedule</h1>

      {interviews.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">No scheduled interviews yet.</p>
          <Link
            href="/team"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Back to My Interviews
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDates.map((dateKey) => {
            const list = byDate[dateKey];
            const label =
              dateKey === "no-date"
                ? "No date set"
                : formatDate(new Date(dateKey + "T12:00:00"));
            return (
              <section key={dateKey}>
                <h2 className="font-semibold text-gray-900 mb-3">{label}</h2>
                <div className="space-y-2">
                  {list.map((interview) => (
                    <Link
                      key={interview.id}
                      href={`/team/interview/${interview.id}`}
                      className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {interview.application.candidate.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {interview.application.job.title} ·{" "}
                          {interview.roundName}
                        </p>
                      </div>
                      {interview.scheduledAt && (
                        <p className="text-sm font-medium text-gray-600">
                          {formatTime(interview.scheduledAt)}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}

          <p>
            <Link
              href="/team"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              ← Back to My Interviews
            </Link>
          </p>
        </div>
      )}
    </div>
  );
}
