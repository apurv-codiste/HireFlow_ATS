import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 md:px-8">
        <h1 className="text-2xl font-bold text-blue-600">HireFlow</h1>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/jobs"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Browse Jobs
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-col items-center justify-center px-4 py-16 md:py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 md:text-5xl max-w-2xl">
          Hire Smarter with AI-Powered Screening
        </h2>
        <p className="mt-4 text-lg text-gray-600 max-w-xl">
          Automated multi-tenant ATS that screens candidates with zero
          human-in-the-loop AI, tracks bottlenecks, and keeps your hiring
          pipeline moving.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/jobs"
            className="rounded-lg bg-blue-600 px-6 py-3 text-lg font-medium text-white hover:bg-blue-700 transition-colors"
          >
            View Open Positions
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 text-lg font-medium text-gray-700 hover:bg-white transition-colors"
          >
            HR Dashboard
          </Link>
        </div>

        {/* Feature Cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-4xl">
          <FeatureCard
            title="AI CV Screening"
            description="Automatically score and route candidates based on job description match. No manual filtering needed."
          />
          <FeatureCard
            title="Bottleneck Alerts"
            description="Real-time alerts when candidates are stuck in any stage too long. Never lose a great hire."
          />
          <FeatureCard
            title="3-Round Pipeline"
            description="Tech test, HR interview, and final round — all tracked with timestamps and automated handoffs."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 text-left">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}
