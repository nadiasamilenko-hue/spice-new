import { Link } from "@tanstack/react-router";
import logo from "@/assets/spice-market-logo.webp.asset.json";

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-primary text-primary-foreground">
      <div className="container mx-auto grid gap-10 px-4 py-14 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={logo.url}
              alt="Spice Market"
              className="h-10 w-10 rounded-full object-cover"
            />
            <span className="font-serif text-xl">Spice Market</span>
          </div>
          <p className="mt-4 text-sm text-primary-foreground/75 max-w-xs">
            Преміальні спеції, авторські суміші та чаї для тих, хто любить готувати з настроєм.
          </p>
        </div>

        <div>
          <h4 className="text-sm font-medium tracking-wider uppercase mb-4">Магазин</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/75">
            <li>
              <Link to="/shop">Усі товари</Link>
            </li>
            <li>
              <Link to="/shop" search={{ cat: "clean" } as never}>
                Чисті спеції
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ cat: "blend" } as never}>
                Суміші
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ cat: "tea" } as never}>
                Чаї
              </Link>
            </li>
            <li>
              <Link to="/shop" search={{ cat: "author" } as never}>
                Авторські суміші
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium tracking-wider uppercase mb-4">Допомога</h4>
          <ul className="space-y-2 text-sm text-primary-foreground/75">
            <li>Доставка та оплата</li>
            <li>Повернення</li>
            <li>FAQ</li>
            <li>
              <Link to="/contact">Контакти</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-medium tracking-wider uppercase mb-4">Розсилка</h4>
          <p className="text-sm text-primary-foreground/75 mb-3">
            Рецепти й закриті колекції — раз на місяць, без спаму.
          </p>
          <form className="flex gap-2">
            <input
              type="email"
              placeholder="email@example.com"
              className="w-full rounded-sm border border-primary-foreground/30 bg-transparent px-3 py-2 text-sm placeholder:text-primary-foreground/50 focus:border-accent focus:outline-none"
            />
            <button className="rounded-sm bg-accent px-4 text-sm font-medium text-accent-foreground hover:bg-accent/90">
              OK
            </button>
          </form>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="container mx-auto flex flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/60 sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Spice Market. Усі права захищено.</span>
          <span>Зроблено з любов'ю до смаків</span>
        </div>
      </div>
    </footer>
  );
}
