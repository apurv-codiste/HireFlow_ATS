"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

type TeamMember = { id: string; name: string; email: string };

export function ApplicationActions({
  applicationId,
  currentStatus,
  teamMembers,
}: {
  applicationId: string;
  currentStatus: string;
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({
    interviewerId: "",
    roundName: "",
    scheduledAt: "",
  });
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success("Status updated");
        router.refresh();
      } else {
        toast.error("Failed to update status");
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(assignData),
      });
      if (res.ok) {
        toast.success("Interviewer assigned");
        setShowAssign(false);
        router.refresh();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to assign");
      }
    } finally {
      setLoading(false);
    }
  }

  const canAssign = [
    "R1_PENDING",
    "R2_PENDING",
    "R3_PENDING",
    "WAITLIST",
  ].includes(currentStatus);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-4">
        {canAssign && (
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
          >
            Assign Interviewer
          </button>
        )}
        {currentStatus === "WAITLIST" && (
          <button
            onClick={() => updateStatus("R1_PENDING")}
            disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Move to R1
          </button>
        )}
        {currentStatus === "R1_DONE" && (
          <button
            onClick={() => updateStatus("R2_PENDING")}
            disabled={loading}
            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-700"
          >
            Move to R2
          </button>
        )}
        {currentStatus === "R2_DONE" && (
          <button
            onClick={() => updateStatus("R3_PENDING")}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
          >
            Move to R3
          </button>
        )}
        {currentStatus === "R3_DONE" && (
          <button
            onClick={() => updateStatus("HIRED")}
            disabled={loading}
            className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
          >
            Hire
          </button>
        )}
        {!["REJECTED", "HIRED"].includes(currentStatus) && (
          <button
            onClick={() => updateStatus("REJECTED")}
            disabled={loading}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
          >
            Reject
          </button>
        )}
      </div>

      {/* Assign Modal */}
      {showAssign && (
        <form
          onSubmit={handleAssign}
          className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Team Member
            </label>
            <select
              value={assignData.interviewerId}
              onChange={(e) =>
                setAssignData({ ...assignData, interviewerId: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select interviewer</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Round
            </label>
            <select
              value={assignData.roundName}
              onChange={(e) =>
                setAssignData({ ...assignData, roundName: e.target.value })
              }
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Select round</option>
              <option value="R1 Tech">R1 Tech</option>
              <option value="R2 HR">R2 HR</option>
              <option value="R3 Final">R3 Final</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Schedule (optional)
            </label>
            <input
              type="datetime-local"
              value={assignData.scheduledAt}
              onChange={(e) =>
                setAssignData({ ...assignData, scheduledAt: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Assigning..." : "Assign"}
            </button>
            <button
              type="button"
              onClick={() => setShowAssign(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
