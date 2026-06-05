import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Вхід — Spice Market" }] }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Вітаємо!");
    navigate({ to: "/admin" });
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-24">
      <h1 className="text-3xl mb-8">Вхід</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-3" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Пароль</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-3" />
        </div>
        <button disabled={loading} type="submit"
          className="w-full rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50">
          {loading ? "Вхід..." : "Увійти"}
        </button>
      </form>
    </div>
  );
}