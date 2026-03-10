import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name || session.user.email || "User",
        email: session.user.email || "",
        role: session.user.role,
      }}
    >
      {children}
    </DashboardShell>
  );
}
