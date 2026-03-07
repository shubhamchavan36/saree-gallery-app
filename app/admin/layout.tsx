import { redirect } from "next/navigation";
import { hasAdminSession } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const authenticated = await hasAdminSession();
  if (!authenticated) {
    redirect("/login");
  }

  return children;
}
