import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ApplyForm } from "./apply-form";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const job = await prisma.job.findUnique({
    where: { shareableSlug: slug },
    include: {
      tenant: { select: { name: true } },
      _count: { select: { applications: true } },
    },
  });

  if (!job || job.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-200">
          <div className="mb-6">
            <p className="text-sm text-blue-600 font-medium mb-1">
              {job.tenant.name}
            </p>
            <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
            {job.department && (
              <p className="text-gray-600 mt-1">{job.department}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-3 text-sm text-gray-500">
              {job.budget && <span>Budget: {job.budget}</span>}
              {job.targetTimeline && (
                <span>
                  Target: {new Date(job.targetTimeline).toLocaleDateString()}
                </span>
              )}
              <span>{job._count.applications} applicants</span>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="font-semibold text-gray-900 mb-3">
              Job Description
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {job.description}
            </div>
          </div>

          <div className="border-t mt-8 pt-6">
            <h2 className="font-semibold text-gray-900 mb-4">
              Apply for this position
            </h2>
            <ApplyForm jobId={job.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
