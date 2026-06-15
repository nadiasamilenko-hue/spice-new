import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { categories, type Category, type Product } from "@/lib/products";
import { listProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/ProductCard";

const searchSchema = z.object({
  cat: z.enum(["clean", "blend", "author", "tea", "gift", "other"]).optional(),
  q: z.string().optional(),
  pack: z.enum(["glass", "doypack", "plastic"]).optional(),
});

const PACK_MAP: Record<string, { label: string; subtitle: string; value: string }> = {
  glass: {
    label: "Скляна баночка з деревʼяною кришкою",
    subtitle: "Преміум-формат у склі",
    value: "скляна баночка з деревʼяною кришкою (скло)",
  },
  doypack: {
    label: "Дой пак L-XL",
    subtitle: "Зручний формат запасу",
    value: "дой пак L-XL",
  },
  plastic: {
    label: "Пластикова баночка",
    subtitle: "Практичний формат на щодень",
    value: "пластикова баночка",
  },
};

export const Route = createFileRoute("/shop")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ cat: search.cat, q: search.q, pack: search.pack }),
  loader: ({ deps }) =>
    listProducts({
      data: {
        category: deps.cat,
        search: deps.q,
        pack: deps.pack ? PACK_MAP[deps.pack]?.value : undefined,
      },
    }).then((products) => ({ products })),
  head: ({ match }) => {
    const cat = (match.search as { cat?: string }).cat;
    const pack = (match.search as { pack?: keyof typeof PACK_MAP }).pack;
    const q = (match.search as { q?: string }).q;
    const titles: Record<string, { title: string; desc: string }> = {
      clean: {
        title: "Чисті спеції — купити онлайн | Spice Market",
        desc: "Натуральні чисті спеції.",
      },
      blend: { title: "Класичні суміші спецій | Spice Market", desc: "Перевірена класика." },
      author: { title: "Авторські суміші спецій | Spice Market", desc: "Фірмові купажі від шефа." },
      tea: { title: "Чай преміум онлайн | Spice Market", desc: "Авторські купажі чаю." },
      gift: { title: "Подарункові набори спецій | Spice Market", desc: "Подарункові набори." },
    };
    let meta =
      cat && titles[cat]
        ? titles[cat]
        : { title: "Магазин — Spice Market", desc: "Каталог спецій." };
    if (pack && PACK_MAP[pack]) {
      meta = {
        title: `${PACK_MAP[pack].label} — Spice Market`,
        desc: `${PACK_MAP[pack].subtitle}. Каталог спецій у форматі ${PACK_MAP[pack].label}.`,
      };
    }
    return {
      meta: [
        { title: meta.title },
        { name: "description", content: meta.desc },
        { property: "og:title", content: meta.title },
        { property: "og:description", content: meta.desc },
        {
          property: "og:url",
          content: pack ? `/shop?pack=${pack}` : cat ? `/shop?cat=${cat}` : "/shop",
        },
      ],
      links: [
        {
          rel: "canonical",
          href: pack
            ? `/shop?pack=${pack}`
            : cat
              ? `/shop?cat=${cat}`
              : q
                ? `/shop?q=${encodeURIComponent(q)}`
                : "/shop",
        },
      ],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: meta.title,
            description: meta.desc,
            url: pack ? `/shop?pack=${pack}` : cat ? `/shop?cat=${cat}` : "/shop",
          }),
        },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  component: ShopPage,
});

function ShopPage() {
  const { cat, q, pack } = Route.useSearch();
  const { products } = Route.useLoaderData();
  const activeCat = categories.find((c) => c.id === cat);
  const activePack = pack ? PACK_MAP[pack] : null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Магазин</p>
        <h1 className="mt-2 text-4xl md:text-5xl">
          {activePack?.label ?? activeCat?.title ?? "Усі товари"}
        </h1>
        {(activePack?.subtitle || activeCat?.subtitle || q) && (
          <p className="mt-2 text-muted-foreground">
            {q ? `Результати пошуку для «${q}»` : (activePack?.subtitle ?? activeCat?.subtitle)}
          </p>
        )}
      </div>

      <div className="mb-10 flex flex-wrap gap-2">
        <CatChip to={undefined} active={!cat}>
          Усі
        </CatChip>
        {categories.map((c) => (
          <CatChip key={c.id} to={c.id} active={cat === c.id}>
            {c.title}
          </CatChip>
        ))}
      </div>

      {products.length === 0 ? (
        <div className="rounded-sm border border-dashed border-border p-12 text-center text-muted-foreground">
          Нічого не знайдено.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 xl:grid-cols-4">
          {products.map((p: Product) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatChip({
  to,
  active,
  children,
}: {
  to?: Category;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/shop"
      search={to ? ({ cat: to } as never) : ({} as never)}
      className={`rounded-sm border px-4 py-2 text-sm transition ${
        active
          ? "border-accent bg-accent text-accent-foreground"
          : "border-border hover:border-accent"
      }`}
    >
      {children}
    </Link>
  );
}
