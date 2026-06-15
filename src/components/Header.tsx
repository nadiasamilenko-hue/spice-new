import { Link, useNavigate } from "@tanstack/react-router";
import { Search, ShoppingBag, Heart, User, LogOut, Settings } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { useState, useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";
import { isCurrentUserAdmin } from "@/lib/admin.functions";
import { listProducts } from "@/lib/catalog.functions";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/spice-market-logo.webp.asset.json";
import type { Session } from "@supabase/supabase-js";

const nav = [
  { to: "/shop", label: "Магазин", search: undefined },
  { to: "/shop", label: "Чисті спеції", search: { cat: "clean" } as const },
  { to: "/shop", label: "Суміші", search: { cat: "blend" } as const },
  { to: "/shop", label: "Авторські", search: { cat: "author" } as const },
  { to: "/shop", label: "Чаї", search: { cat: "tea" } as const },
  { to: "/about", label: "Бренд", search: undefined },
  { to: "/contact", label: "Контакти", search: undefined },
];

export function Header() {
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const searchRef = useRef<HTMLFormElement>(null);
  const mobileSearchRef = useRef<HTMLFormElement>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fetchAdmin = useServerFn(isCurrentUserAdmin);
  const fetchProducts = useServerFn(listProducts);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 180);
    return () => clearTimeout(t);
  }, [q]);

  const { data: suggestions } = useQuery({
    queryKey: ["search-suggest", debouncedQ],
    queryFn: () => fetchProducts({ data: { search: debouncedQ, limit: 6 } }),
    enabled: debouncedQ.length >= 2,
    staleTime: 30_000,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user) {
      setIsAdminUser(false);
      return;
    }
    fetchAdmin()
      .then((res: { isAdmin: boolean }) => setIsAdminUser(res.isAdmin))
      .catch(() => setIsAdminUser(false));
  }, [session, fetchAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node) &&
        mobileSearchRef.current &&
        !mobileSearchRef.current.contains(e.target as Node)
      ) {
        setSuggestOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="border-b border-border/60 bg-primary text-primary-foreground">
        <div className="container mx-auto flex justify-center px-4 py-2 text-xs tracking-wide">
          Безкоштовна доставка від 1 200 ₴ · Нова Пошта та InPost
        </div>
      </div>
      <div className="container mx-auto flex items-center gap-6 px-4 py-4">
        <Link to="/" className="flex items-center gap-2">
          <img
            src={logo.url}
            alt="Spice Market"
            className="h-10 w-10 rounded-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = "none";
            }}
          />
          <span className="font-serif text-xl tracking-tight">Spice Market</span>
        </Link>

        <form
          ref={searchRef}
          className="ml-2 hidden flex-1 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 md:flex"
          onSubmit={(e) => {
            e.preventDefault();
            const list = suggestions ?? [];
            if (activeIdx >= 0 && list[activeIdx]) {
              navigate({ to: "/product/$slug", params: { slug: list[activeIdx].slug } });
              setSuggestOpen(false);
              return;
            }
            navigate({ to: "/shop", search: q ? { q } : {} as never });
            setSuggestOpen(false);
          }}
          style={{ position: "relative" }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSuggestOpen(true);
              setActiveIdx(-1);
            }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={(e) => {
              const list = suggestions ?? [];
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIdx((i) => Math.min(i + 1, list.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIdx((i) => Math.max(i - 1, -1));
              } else if (e.key === "Escape") {
                setSuggestOpen(false);
              }
            }}
            placeholder="Шукайте: паприка, для курки, чай..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          {suggestOpen && debouncedQ.length >= 2 && (
            <div className="absolute left-0 right-0 top-full mt-1 max-h-96 overflow-auto rounded-sm border border-border bg-popover shadow-lg z-50">
              {!suggestions ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Пошук…</div>
              ) : suggestions.length === 0 ? (
                <div className="px-3 py-2 text-xs text-muted-foreground">Нічого не знайдено</div>
              ) : (
                <>
                  {suggestions.map((p, i) => (
                    <Link
                      key={p.slug}
                      to="/product/$slug"
                      params={{ slug: p.slug }}
                      onMouseEnter={() => setActiveIdx(i)}
                      onClick={() => setSuggestOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 text-sm ${i === activeIdx ? "bg-accent/10" : ""} hover:bg-accent/10`}
                    >
                      <img
                        src={p.image || "/placeholder.svg"}
                        alt=""
                        className="h-8 w-8 rounded-sm object-cover bg-secondary"
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      <span className="text-xs text-muted-foreground">{p.price} ₴</span>
                    </Link>
                  ))}
                  <Link
                    to="/shop"
                    search={{ q } as never}
                    onClick={() => setSuggestOpen(false)}
                    className="block border-t border-border px-3 py-2 text-xs text-accent hover:bg-accent/10"
                  >
                    Усі результати для «{q}» →
                  </Link>
                </>
              )}
            </div>
          )}
        </form>

        <div className="ml-auto flex items-center gap-1 text-foreground/80">
          <Link
            to="/favorites"
            className="relative rounded-sm p-2 hover:bg-secondary"
            aria-label="Обране"
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                {favorites.length}
              </span>
            )}
          </Link>
          {!session?.user && (
            <Link
              to="/auth"
              className="rounded-sm p-2 hover:bg-secondary md:hidden"
              aria-label="Увійти"
            >
              <User className="h-5 w-5" />
            </Link>
          )}
          <div className="relative hidden md:inline-flex" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="rounded-sm p-2 hover:bg-secondary"
              aria-label="Кабінет"
            >
              <User className="h-5 w-5" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-md border border-border bg-popover p-1 shadow-lg z-50">
                {session?.user ? (
                  <>
                    {isAdminUser && (
                      <Link
                        to="/admin"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                      >
                        <Settings className="h-4 w-4" />
                        Адмін-панель
                      </Link>
                    )}
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        setSession(null);
                        setMenuOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Вийти
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <User className="h-4 w-4" />
                    Увійти
                  </Link>
                )}
              </div>
            )}
          </div>
          <Link
            to="/cart"
            className="relative rounded-sm p-2 hover:bg-secondary"
            aria-label="Кошик"
          >
            <ShoppingBag className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-medium text-accent-foreground">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>

      {/* Mobile search */}
      <form
        ref={mobileSearchRef}
        className="flex md:hidden flex-1 items-center gap-2 rounded-sm border border-border bg-card px-3 py-2 mx-4 mb-3"
        onSubmit={(e) => {
          e.preventDefault();
          const list = suggestions ?? [];
          if (activeIdx >= 0 && list[activeIdx]) {
            navigate({ to: "/product/$slug", params: { slug: list[activeIdx].slug } });
            setSuggestOpen(false);
            return;
          }
          navigate({ to: "/shop", search: q ? { q } : {} as never });
          setSuggestOpen(false);
        }}
        style={{ position: "relative" }}
      >
        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setSuggestOpen(true);
            setActiveIdx(-1);
          }}
          onFocus={() => setSuggestOpen(true)}
          onKeyDown={(e) => {
            const list = suggestions ?? [];
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActiveIdx((i) => Math.min(i + 1, list.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActiveIdx((i) => Math.max(i - 1, -1));
            } else if (e.key === "Escape") {
              setSuggestOpen(false);
            }
          }}
          placeholder="Шукайте: паприка, для курки, чай..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {suggestOpen && debouncedQ.length >= 2 && (
          <div className="absolute left-0 right-0 top-full mt-1 max-h-96 overflow-auto rounded-sm border border-border bg-popover shadow-lg z-50">
            {!suggestions ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Пошук…</div>
            ) : suggestions.length === 0 ? (
              <div className="px-3 py-2 text-xs text-muted-foreground">Нічого не знайдено</div>
            ) : (
              <>
                {suggestions.map((p, i) => (
                  <Link
                    key={p.slug}
                    to="/product/$slug"
                    params={{ slug: p.slug }}
                    onMouseEnter={() => setActiveIdx(i)}
                    onClick={() => setSuggestOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 text-sm ${i === activeIdx ? "bg-accent/10" : ""} hover:bg-accent/10`}
                  >
                    <img
                      src={p.image || "/placeholder.svg"}
                      alt=""
                      className="h-8 w-8 rounded-sm object-cover bg-secondary"
                    />
                    <span className="flex-1 truncate">{p.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{p.price} ₴</span>
                  </Link>
                ))}
                <Link
                  to="/shop"
                  search={{ q } as never}
                  onClick={() => setSuggestOpen(false)}
                  className="block border-t border-border px-3 py-2 text-xs text-accent hover:bg-accent/10"
                >
                  Усі результати для «{q}» →
                </Link>
              </>
            )}
          </div>
        )}
      </form>

      <nav className="border-t border-border/60">
        <div className="container mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2 text-sm text-foreground/80 font-serif">
          {nav.map((n, i) => (
            <Link
              key={i}
              to={n.to}
              search={n.search as never}
              className="transition-colors hover:text-accent"
              activeProps={{ className: "text-accent" }}
            >
              {n.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
