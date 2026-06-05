import { createFileRoute, Outlet, Link, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const res = await isCurrentUserAdmin();
    if (!res.isAdmin) throw new Error("Доступ заборонено: потрібна роль admin");
  },
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-2xl mb-4">Доступ заборонено</h1>
      <p className="text-muted-foreground">{error.message}</p>
      <Link to="/auth" className="mt-6 inline-block text-accent underline">До входу</Link>
    </div>
  ),
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-xl tracking-wider uppercase">Адмін-панель</h1>
        <nav className="flex gap-4 text-sm">
          <Link to="/admin" className="hover:text-accent" activeProps={{ className: "text-accent" }}>Товари</Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/auth"; }}
            className="text-muted-foreground hover:text-foreground">Вийти</button>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}