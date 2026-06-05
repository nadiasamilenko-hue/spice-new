import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { Heart } from "lucide-react";
import { useFavorites } from "@/lib/favorites";

export function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.slug);
  return (
    <Link to="/product/$slug" params={{ slug: product.slug }} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-secondary">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          loading="lazy"
          decoding="async"
          width={500}
          height={500}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectFit: "cover" }}
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
          }}
        />
        {product.badge && (
          <span className="absolute left-3 top-3 rounded-sm bg-accent px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-accent-foreground">
            {product.badge}
          </span>
        )}
        {product.stockStatus === "out_of_stock" && (
          <span className="absolute left-3 bottom-3 rounded-sm bg-background/90 px-2 py-1 text-[10px] uppercase tracking-wider">
            Немає в наявності
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.slug); }}
          aria-label={fav ? "Видалити з обраного" : "Додати в обране"}
          aria-pressed={fav}
          className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
        >
          <Heart className={`h-4 w-4 transition ${fav ? "fill-accent text-accent" : "text-foreground/70"}`} />
        </button>
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className="font-serif text-lg leading-tight">{product.name}</h3>
        <span className="shrink-0 text-sm text-muted-foreground">{product.price} ₴</span>
      </div>
      {product.weight && <p className="mt-1 text-xs text-muted-foreground">{product.weight} · {product.packLabel ?? ""}</p>}
    </Link>
  );
}
