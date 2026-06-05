import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getProductBySlug, listProducts } from "@/lib/catalog.functions";
import type { Product } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingBag, Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const product = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    const related = (await listProducts({ data: { category: product.category, limit: 8 } }))
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);
    return { product, related };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Spice Market` },
          { name: "description", content: loaderData.product.description.slice(0, 160) },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:image", content: loaderData.product.image },
          { property: "og:type", content: "product" },
        ]
      : [],
    links: loaderData ? [{ rel: "canonical", href: `/product/${loaderData.product.slug}` }] : [],
  }),
  notFoundComponent: () => (
    <div className="container mx-auto px-4 py-24 text-center">
      <h1 className="text-3xl">Товар не знайдено</h1>
      <Link to="/shop" className="mt-6 inline-block text-accent underline">До каталогу</Link>
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  component: ProductPage,
});

function ProductPage() {
  const { product, related } = Route.useLoaderData();
  const cart = useCart();
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.slug);
  const outOfStock = product.stockStatus === "out_of_stock";

  return (
    <div>
      <div className="container mx-auto px-4 py-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-accent">Головна</Link> /{" "}
        <Link to="/shop" className="hover:text-accent">Магазин</Link> /{" "}
        <span className="text-foreground/80">{product.name}</span>
      </div>

      <section className="container mx-auto grid gap-10 px-4 pb-16 lg:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl bg-secondary">
          <img
            src={product.image || "/placeholder.svg"}
            alt={product.name}
            loading="lazy"
            decoding="async"
            width={800}
            height={800}
            className="h-full w-full object-cover"
            style={{ objectFit: "cover" }}
            onError={(e) => {
              const img = e.currentTarget as HTMLImageElement;
              if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
            }}
          />
        </div>

        <div>
          {product.categoryTitle && (
            <p className="text-xs uppercase tracking-[0.25em] text-accent">{product.categoryTitle}</p>
          )}
          <h1 className="mt-2 text-4xl md:text-5xl">{product.name}</h1>
          {product.description && (
            <p className="mt-4 whitespace-pre-line text-foreground/75">{product.description}</p>
          )}

          <div className="mt-10 rounded-sm border border-border bg-card p-5">
            <div className="flex items-baseline justify-between">
              <div>
                <div className="font-serif text-3xl">{product.price} ₴</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {[product.packLabel, product.weight].filter(Boolean).join(" · ") || "—"}
                </div>
              </div>
              <div className="text-xs text-muted-foreground text-right">
                {outOfStock ? "Немає в наявності" : product.stockStatus === "low_stock" ? "Залишилось мало" : "В наявності"}
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                disabled={outOfStock}
                onClick={() =>
                  cart.add({
                    slug: product.slug,
                    name: product.name,
                    image: product.image,
                    price: product.price,
                    weight: product.weight,
                    packLabel: product.packLabel,
                  })
                }
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-6 py-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
              >
                <ShoppingBag className="h-4 w-4" />
                {outOfStock ? "Немає в наявності" : "Додати в кошик"}
              </button>
              <button
                onClick={() => toggle(product.slug)}
                className="rounded-sm border border-border p-4 hover:border-accent"
                aria-label="В обране"
              >
                <Heart className={`h-5 w-5 ${fav ? "fill-accent text-accent" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-secondary/40 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl mb-8">Часто беруть разом</h2>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p: Product) => <ProductCard key={p.slug} product={p} />)}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
