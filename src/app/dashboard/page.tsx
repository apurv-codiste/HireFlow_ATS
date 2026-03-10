import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function DashboardRedirect() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  switch (session.user.role) {
    case "SUPER_ADMIN":
      redirect("/super-admin");
    case "HR_ADMIN":
      redirect("/hr");
    case "TEAM_MEMBER":
      redirect("/team");
    case "CANDIDATE":
      redirect("/candidate");
    default:
      redirect("/login");
  }
}
