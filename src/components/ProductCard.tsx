import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import { Heart, ShoppingBag, Check, Loader2 } from "lucide-react";
import { useFavorites } from "@/lib/favorites";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listVariantsByName } from "@/lib/catalog.functions";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { isDoyPak, parseSizes } from "@/lib/pack-sizes";

export function ProductCard({ product }: { product: Product }) {
  const { isFavorite, toggle } = useFavorites();
  const fav = isFavorite(product.slug);
  const cart = useCart();
  const [packOpen, setPackOpen] = useState(false);
  const [added, setAdded] = useState(false);
  const fetchVariants = useServerFn(listVariantsByName);
  const { data: variants, isLoading: variantsLoading } = useQuery({
    queryKey: ["variants", product.name],
    queryFn: () => fetchVariants({ data: { name: product.name } }),
    enabled: packOpen,
    staleTime: 60_000,
  });
  const outOfStock = product.stockStatus === "out_of_stock";

  const doyPak = isDoyPak(product.packLabel);
  const sizes = doyPak ? parseSizes(product.weight) : [];
  const hasSizes = sizes.length > 1;
  const [size, setSize] = useState<string>(sizes[0] ?? "");

  const addToCart = (p: {
    slug: string;
    name: string;
    image: string;
    price: number;
    weight?: string | null;
    packLabel?: string | null;
  }) => {
    const finalWeight = hasSizes && p.slug === product.slug ? size : (p.weight ?? null);
    cart.add({
      slug: p.slug,
      name: p.name,
      image: p.image,
      price: p.price,
      weight: finalWeight,
      packLabel: p.packLabel,
    });
    setAdded(true);
    const tag = [finalWeight, p.packLabel].filter(Boolean).join(" · ");
    toast.success(`«${p.name}» додано в кошик${tag ? ` · ${tag}` : ""}`);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="group block">
      <Link to="/product/$slug" params={{ slug: product.slug }} className="block">
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
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggle(product.slug);
            }}
            aria-label={fav ? "Видалити з обраного" : "Додати в обране"}
            aria-pressed={fav}
            className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-background/80 backdrop-blur transition hover:bg-background"
          >
            <Heart
              className={`h-4 w-4 transition ${fav ? "fill-accent text-accent" : "text-foreground/70"}`}
            />
          </button>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-lg leading-tight">{product.name}</h3>
          <span className="shrink-0 text-sm text-muted-foreground">{product.price} ₴</span>
        </div>
        {product.weight && (
          <p className="mt-1 text-xs text-muted-foreground">
            {product.weight} · {product.packLabel ?? ""}
          </p>
        )}
      </Link>
      {hasSizes && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSize(s);
              }}
              className={`rounded-sm border px-2.5 py-1 text-[11px] transition ${
                s === size
                  ? "border-accent bg-accent/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-accent"
              }`}
              aria-pressed={s === size}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 flex items-stretch gap-2">
        <button
          type="button"
          disabled={outOfStock}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            addToCart(product);
          }}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-accent px-3 py-2.5 text-xs font-medium text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
          aria-label="Швидко додати в кошик"
        >
          {added ? <Check className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
          {outOfStock ? "Немає" : added ? "Додано" : "В кошик"}
        </button>
        <Popover open={packOpen} onOpenChange={setPackOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="rounded-sm border border-border px-3 py-2.5 text-xs hover:border-accent transition"
              aria-label="Вибрати упаковку"
              title="Вибрати упаковку"
            >
              Упаковка
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-2" onClick={(e) => e.stopPropagation()}>
            <div className="px-2 pt-1 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
              Оберіть упаковку
            </div>
            {variantsLoading && (
              <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Завантаження…
              </div>
            )}
            {!variantsLoading && variants && variants.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground">Інші упаковки відсутні.</div>
            )}
            <div className="flex flex-col gap-1">
              {variants?.map((v) => {
                const oos = v.stockStatus === "out_of_stock";
                return (
                  <button
                    key={v.slug}
                    type="button"
                    disabled={oos}
                    onClick={() => {
                      addToCart(v);
                      setPackOpen(false);
                    }}
                    className={`flex items-center justify-between gap-3 rounded-sm border px-3 py-2 text-left text-xs transition ${
                      v.slug === product.slug
                        ? "border-accent bg-accent/10"
                        : "border-border hover:border-accent"
                    } disabled:opacity-50`}
                  >
                    <span className="flex-1">
                      <span className="block">{v.packLabel ?? "—"}</span>
                      {v.weight && (
                        <span className="block text-[10px] text-muted-foreground">{v.weight}</span>
                      )}
                    </span>
                    <span className="shrink-0 font-medium">{v.price} ₴</span>
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
