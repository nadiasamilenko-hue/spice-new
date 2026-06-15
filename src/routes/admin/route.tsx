import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const checkAdmin = useServerFn(isCurrentUserAdmin);
  const [state, setState] = useState<"loading" | "ok" | "forbidden">("loading");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      try {
        const res = await checkAdmin();
        setState(res.isAdmin ? "ok" : "forbidden");
      } catch {
        setState("forbidden");
      }
    })();
  }, [navigate, checkAdmin]);

  if (state === "loading") {
    return (
      <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
        Завантаження…
      </div>
    );
  }
  if (state === "forbidden") {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl mb-4">Доступ заборонено</h1>
        <p className="text-muted-foreground">Потрібна роль admin</p>
        <Link to="/auth" className="mt-6 inline-block text-accent underline">
          До входу
        </Link>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-10">
      <div className="mb-8 flex items-center justify-between border-b border-border pb-4">
        <h1 className="text-xl tracking-wider uppercase">Адмін-панель</h1>
        <nav className="flex gap-4 text-sm">
          <Link
            to="/admin"
            className="hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Товари
          </Link>
          <Link
            to="/admin/content"
            className="hover:text-accent"
            activeProps={{ className: "text-accent" }}
          >
            Контент
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = "/auth";
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            Вийти
          </button>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
