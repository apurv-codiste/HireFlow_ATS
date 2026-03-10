import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { FeedbackForm } from "./feedback-form";

export const dynamic = "force-dynamic";

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.user.role !== "TEAM_MEMBER") redirect("/login");

  const { id } = await params;

  const interview = await prisma.interview.findUnique({
    where: { id },
    include: {
      application: {
        include: {
          candidate: { select: { name: true, email: true } },
          job: { select: { title: true, department: true, description: true } },
        },
      },
    },
  });

  if (!interview || interview.interviewerId !== session.user.id) {
    notFound();
  }

  // Parse AI summary for context
  let aiSummary = null;
  if (interview.application.aiSummary) {
    try {
      aiSummary = JSON.parse(interview.application.aiSummary);
    } catch {
      aiSummary = null;
    }
  }

  return (
    <div className="max-w-3xl">
      <a
        href="/team"
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to My Interviews
      </a>

      <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <h1 className="text-xl font-bold text-gray-900 mb-1">
          {interview.roundName}
        </h1>
        <p className="text-gray-500">
          {interview.application.job.title}
          {interview.application.job.department &&
            ` · ${interview.application.job.department}`}
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-gray-500">Candidate</p>
            <p className="font-medium text-gray-900">
              {interview.application.candidate.name}
            </p>
            <p className="text-sm text-gray-500">
              {interview.application.candidate.email}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500">Scheduled</p>
            <p className="text-gray-900">
              {interview.scheduledAt
                ? formatDate(interview.scheduledAt)
                : "Not scheduled"}
            </p>
          </div>
        </div>

        {interview.application.aiScore && (
          <div className="mt-4 rounded-lg bg-blue-50 p-3">
            <p className="text-sm font-medium text-blue-800">
              AI Score: {interview.application.aiScore}/5
            </p>
            {aiSummary?.summary && (
              <p className="text-sm text-blue-700 mt-1">{aiSummary.summary}</p>
            )}
          </div>
        )}
      </div>

      {/* Job Description */}
      <div className="rounded-xl bg-white border border-gray-200 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-2">Job Description</h2>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {interview.application.job.description.slice(0, 1000)}
          {interview.application.job.description.length > 1000 && "..."}
        </div>
      </div>

      {/* Feedback */}
      <div className="rounded-xl bg-white border border-gray-200 p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Your Feedback</h2>
        {interview.passed !== null ? (
          <div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-medium ${
                interview.passed
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {interview.passed ? "Passed" : "Failed"}
            </span>
            {interview.feedback && (
              <p className="mt-3 text-gray-700 bg-gray-50 rounded-lg p-3">
                {interview.feedback}
              </p>
            )}
          </div>
        ) : (
          <FeedbackForm interviewId={interview.id} />
        )}
      </div>
    </div>
  );
}
