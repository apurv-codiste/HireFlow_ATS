export const AI_SCORE_THRESHOLD = {
  AUTO_APPROVE: 4,
  WAITLIST: 3,
} as const;

export const BOTTLENECK_DAYS = 5;

export const ITEMS_PER_PAGE = 15;

export const APP_NAME = "HireFlow";

export const STATUS_LABELS: Record<string, string> = {
  PENDING_AI: "AI Review",
  WAITLIST: "Waitlisted",
  REJECTED: "Rejected",
  R1_PENDING: "R1 Pending",
  R1_SCHEDULED: "R1 Scheduled",
  R1_DONE: "R1 Complete",
  R2_PENDING: "R2 Pending",
  R2_SCHEDULED: "R2 Scheduled",
  R2_DONE: "R2 Complete",
  R3_PENDING: "R3 Pending",
  R3_SCHEDULED: "R3 Scheduled",
  R3_DONE: "R3 Complete",
  HIRED: "Hired",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING_AI: "bg-yellow-100 text-yellow-800",
  WAITLIST: "bg-orange-100 text-orange-800",
  REJECTED: "bg-red-100 text-red-800",
  R1_PENDING: "bg-blue-100 text-blue-800",
  R1_SCHEDULED: "bg-blue-100 text-blue-800",
  R1_DONE: "bg-blue-200 text-blue-900",
  R2_PENDING: "bg-purple-100 text-purple-800",
  R2_SCHEDULED: "bg-purple-100 text-purple-800",
  R2_DONE: "bg-purple-200 text-purple-900",
  R3_PENDING: "bg-indigo-100 text-indigo-800",
  R3_SCHEDULED: "bg-indigo-100 text-indigo-800",
  R3_DONE: "bg-indigo-200 text-indigo-900",
  HIRED: "bg-green-100 text-green-800",
};
