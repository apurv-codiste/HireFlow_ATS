"use client";

import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export function JobActions({
  jobId,
  status,
  shareUrl,
}: {
  jobId: string;
  status: string;
  shareUrl: string;
}) {
  const router = useRouter();

  async function handlePublish() {
    const res = await fetch(`/api/jobs/${jobId}/publish`, { method: "POST" });
    if (res.ok) {
      toast.success("Job published!");
      router.refresh();
    } else {
      toast.error("Failed to publish");
    }
  }

  async function handleClose() {
    const res = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Job closed");
      router.refresh();
    } else {
      toast.error("Failed to close");
    }
  }

  function copyShareLink() {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied!");
  }

  return (
    <div className="flex gap-2">
      {status === "DRAFT" && (
        <button
          onClick={handlePublish}
          className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
        >
          Publish
        </button>
      )}
      {status === "PUBLISHED" && (
        <>
          <button
            onClick={copyShareLink}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Copy Link
          </button>
          <button
            onClick={handleClose}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Close
          </button>
        </>
      )}
    </div>
  );
}
