import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { listAdminProducts } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminProductsList,
});

function AdminProductsList() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => listAdminProducts(),
  });

  if (isLoading) return <p className="text-muted-foreground">Завантаження…</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  return (
    <div>
      <h2 className="text-2xl mb-6">Товари ({data?.length ?? 0})</h2>
      <div className="grid grid-cols-1 gap-3">
        {data?.map((p) => (
          <Link
            key={p.id}
            to="/admin/products/$id"
            params={{ id: p.id }}
            className="flex items-center gap-4 rounded-sm border border-border p-3 hover:border-accent"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-sm bg-secondary">
              <img
                src={p.image_url || "/placeholder.svg"}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="truncate font-medium">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {p.price} ₴ · залишок: {p.quantity} · {p.visible ? "видимий" : "прихований"}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">Редагувати →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
