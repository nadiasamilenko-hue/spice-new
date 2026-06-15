import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { listProducts } from "@/lib/catalog.functions";
import { useFavorites } from "@/lib/favorites";
import { ProductCard } from "@/components/ProductCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/favorites")({
  head: () => ({ meta: [{ title: "Обране — Spice Market" }] }),
  component: FavoritesPage,
});

function FavoritesPage() {
  const { favorites } = useFavorites();
  const fetchProducts = useServerFn(listProducts);
  const { data, isLoading } = useQuery({
    queryKey: ["all-products-fav"],
    queryFn: () => fetchProducts({ data: { limit: 500 } }),
    staleTime: 60_000,
  });

  const items = (data ?? []).filter((p) => favorites.includes(p.slug));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex items-center gap-3">
        <Heart className="h-6 w-6 text-accent" />
        <h1 className="font-serif text-3xl">Обране</h1>
        <span className="text-sm text-muted-foreground">({items.length})</span>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Завантаження…</p>
      ) : items.length === 0 ? (
        <div className="rounded-sm border border-border bg-card p-10 text-center">
          <p className="text-muted-foreground">У вас поки немає улюблених товарів.</p>
          <Link
            to="/shop"
            className="mt-4 inline-block rounded-sm bg-accent px-5 py-2 text-sm text-accent-foreground hover:bg-accent/90"
          >
            Перейти до магазину
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
