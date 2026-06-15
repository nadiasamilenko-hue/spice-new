import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { isCurrentUserAdmin } from "@/lib/admin.functions";
import { Settings, LogOut } from "lucide-react";

export const Route = createFileRoute("/admin-entry")({
  ssr: false,
  head: () => ({ meta: [{ title: "Швидкий вхід — Spice Market" }] }),
  component: AdminEntryPage,
});

function AdminEntryPage() {
  const navigate = useNavigate();
  const fetchAdmin = useServerFn(isCurrentUserAdmin);
  const [email, setEmail] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        navigate({ to: "/auth" });
        return;
      }
      setEmail(data.user.email ?? null);
      try {
        const res: { isAdmin: boolean } = await fetchAdmin();
        setIsAdmin(!!res.isAdmin);
      } catch {
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate, fetchAdmin]);

  return (
    <div className="container mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="text-3xl mb-2 font-serif">Швидкий вхід</h1>
      {email && <p className="text-sm text-muted-foreground mb-8">Ви увійшли як {email}</p>}

      {loading ? (
        <p className="text-muted-foreground">Перевіряємо доступ…</p>
      ) : isAdmin ? (
        <div className="space-y-3">
          <Link
            to="/admin"
            className="inline-flex w-full items-center justify-center gap-2 rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            <Settings className="h-4 w-4" />
            Перейти в адмін-панель
          </Link>
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-sm border border-border px-6 py-3 text-sm hover:bg-secondary"
          >
            На головну
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-muted-foreground mb-4">
            У вашого облікового запису немає прав адміністратора.
          </p>
          <Link
            to="/"
            className="inline-flex w-full items-center justify-center rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90"
          >
            На головну
          </Link>
        </div>
      )}

      <button
        onClick={async () => {
          await supabase.auth.signOut();
          navigate({ to: "/auth" });
        }}
        className="mt-8 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-3 w-3" />
        Вийти
      </button>
    </div>
  );
}
