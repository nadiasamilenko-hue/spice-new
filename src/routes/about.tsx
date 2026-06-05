import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-spices.jpg";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Про бренд — Spice Market" },
      { name: "description", content: "Spice Market — український бренд преміальних спецій для щоденної кухні." },
      { property: "og:title", content: "Про бренд — Spice Market" },
      { property: "og:description", content: "Spice Market — український бренд преміальних спецій." },
      { property: "og:url", content: "/about" },
      { property: "og:image", content: heroImg },
      { name: "twitter:image", content: heroImg },
    ],
    links: [
      { rel: "canonical", href: "/about" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div>
      <section className="container mx-auto px-4 py-16 grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-accent">Про бренд</p>
          <h1 className="mt-3 text-5xl">Спеції — це досвід, не приправа.</h1>
          <p className="mt-6 text-foreground/75 leading-relaxed">
            Spice Market народився з простої ідеї: кожна вечеря заслуговує на справжній аромат.
            Ми привозимо чисті спеції напряму від фермерів, складаємо авторські суміші разом із шефами
            та купажуємо чаї для тих моментів, коли хочеться просто видихнути.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 border-t border-border pt-8">
            <Stat n="42" label="спеції в каталозі" />
            <Stat n="7" label="країн-походжень" />
            <Stat n="12k+" label="щасливих кухонь" />
          </div>
        </div>
        <div className="overflow-hidden rounded-sm">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
        </div>
      </section>
      <section className="bg-secondary/40 py-20">
        <div className="container mx-auto grid gap-8 px-4 md:grid-cols-3">
          {[
            { t: "Чесне походження", d: "Знаємо кожного фермера за іменем. Без посередників і безіменних мішків." },
            { t: "Свіже пакування", d: "Молемо й пакуємо невеликими партіями — аромат не встигає зів'янути." },
            { t: "Без зайвого", d: "Без барвників, підсилювачів і солі. Тільки те, що написано на банці." },
          ].map((x) => (
            <div key={x.t} className="rounded-sm bg-card p-6 border border-border">
              <h3 className="text-xl font-serif">{x.t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ n, label }: { n: string; label: string }) {
  return (
    <div>
      <div className="font-serif text-4xl text-accent">{n}</div>
      <div className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}