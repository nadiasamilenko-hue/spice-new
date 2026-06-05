import { createFileRoute, Link } from "@tanstack/react-router";
import heroImg from "@/assets/hero-spices.jpg";
import packGlass from "@/assets/pack-glass.jpg";
import packDoy from "@/assets/pack-doypack.jpg";
import packPlastic from "@/assets/pack-plastic.jpg";
import { categories, purposes, type Product } from "@/lib/products";
import { listProducts } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/ProductCard";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Spice Market — Преміальні спеції для щоденної кухні" },
      { name: "description", content: "Чисті спеції, авторські суміші та чаї. Швидка доставка по Україні." },
      { property: "og:title", content: "Spice Market — Аромати, які роблять страву" },
      { property: "og:image", content: heroImg },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  loader: async () => {
    const all = await listProducts({ data: { limit: 12 } });
    return { best: all.slice(0, 4), latest: all.slice(-4).reverse() };
  },
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-4 py-24 text-center text-muted-foreground">
      Не вдалося завантажити: {error.message}
    </div>
  ),
  component: Index,
});

function Index() {
  const { best, latest } = Route.useLoaderData();
  return (
    <div>
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/20" />
        </div>
        <div className="container mx-auto px-4 py-24 md:py-36">
          <p className="text-sm uppercase tracking-[0.25em] text-accent">Spice Market · Україна</p>
          <h1 className="mt-4 max-w-2xl text-5xl leading-[1.05] md:text-7xl">
            Аромати, які <em className="not-italic text-accent">роблять</em> страву.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-foreground/75">
            Преміальні спеції, авторські суміші та чаї для щоденної кухні.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-sm bg-accent px-7 py-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              Перейти до магазину <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/shop" search={{ cat: "gift" } as never} className="inline-flex items-center gap-2 rounded-sm border border-foreground/20 px-7 py-4 text-sm hover:bg-foreground/5">
              Подарункові набори
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Категорії</p>
          <h2 className="mt-2 text-4xl">З чого почати</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {categories.map((c) => (
            <Link key={c.id} to="/shop" search={{ cat: c.id } as never} className="group block rounded-sm border border-border bg-card p-6 hover:border-accent">
              <h3 className="text-2xl">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.subtitle}</p>
              <span className="mt-6 inline-flex items-center gap-1 text-sm text-accent">
                Дивитись <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto px-4">
          <div className="mb-10 max-w-2xl">
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Підбір за стравою</p>
            <h2 className="mt-2 text-4xl">Що готуєте сьогодні?</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {purposes.map((p) => (
              <Link key={p.id} to="/shop" search={{ q: p.id } as never} className="group relative aspect-[4/5] overflow-hidden rounded-xl">
                <img src={p.image} alt={p.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <span className="absolute bottom-4 left-4 text-lg font-medium text-white">{p.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Бестселери</p>
          <h2 className="mt-2 text-4xl">Що замовляють найчастіше</h2>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {best.map((p: Product) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>

      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-accent">Пакування</p>
            <h2 className="mt-2 text-4xl">Оберіть свій формат</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[{img:packGlass,label:"Скло",tag:"Преміум"},{img:packDoy,label:"Дой-пак",tag:"Запас"},{img:packPlastic,label:"Пластик",tag:"Практично"}].map((p) => (
              <div key={p.label} className="overflow-hidden rounded-xl bg-primary-foreground/5">
                <div className="aspect-square overflow-hidden rounded-t-xl">
                  <img src={p.img} alt={p.label} loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <div className="text-lg font-serif">{p.label}</div>
                  <div className="text-xs text-primary-foreground/60 uppercase tracking-widest">{p.tag}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-20">
        <div className="mb-10">
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Новинки</p>
          <h2 className="mt-2 text-4xl">Тільки прийшли</h2>
        </div>
        <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {latest.map((p: Product) => <ProductCard key={p.slug} product={p} />)}
        </div>
      </section>
    </div>
  );
}
