import { Sidebar } from "@/components/shared/sidebar";
import { Navbar } from "@/components/shared/navbar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex h-screen bg-muted/20">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar user={{ email: user.email ?? "" }} />
        <main className="flex min-w-0 flex-1 flex-col overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
