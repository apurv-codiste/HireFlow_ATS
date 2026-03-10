"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function FeedbackForm({ interviewId }: { interviewId: string }) {
  const router = useRouter();
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(passed: boolean) {
    if (!feedback.trim()) {
      toast.error("Please provide feedback");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/interviews/${interviewId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passed, feedback }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(passed ? "Candidate passed!" : "Candidate rejected");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        rows={5}
        placeholder="Write your evaluation and feedback here... (required)"
        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <div className="flex gap-3">
        <button
          onClick={() => handleSubmit(true)}
          disabled={loading}
          className="rounded-lg bg-green-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Pass"}
        </button>
        <button
          onClick={() => handleSubmit(false)}
          disabled={loading}
          className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Fail"}
        </button>
      </div>
    </div>
  );
}
