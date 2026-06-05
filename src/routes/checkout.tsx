import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/cart";
import { cartToOrderItems } from "@/lib/order-items";
import { placeOrder, logAbandonedCart } from "@/lib/orders.functions";
import { toast } from "sonner";
import { Check, Truck, Phone, User, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Оформлення замовлення — Spice Market" },
      { name: "description", content: "Оформіть замовлення спецій з оплатою у менеджера." },
    ],
  }),
  component: CheckoutPage,
});

type Carrier = "nova_poshta" | "ukrposhta";
type DeliveryType = "branch" | "locker";
type Contact = "telegram" | "viber" | "whatsapp" | "phone";

const carriers: { id: Carrier; label: string; subtitle: string }[] = [
  { id: "nova_poshta", label: "Нова Пошта", subtitle: "Відділення · поштомат" },
  { id: "ukrposhta", label: "Укрпошта", subtitle: "Відділення по Україні" },
];

const contacts: { id: Contact; label: string }[] = [
  { id: "telegram", label: "Telegram" },
  { id: "viber", label: "Viber" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "phone", label: "Дзвінок" },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const { lines, subtotal, clear } = useCart();
  const items = useMemo(() => cartToOrderItems(lines), [lines]);
  const place = useServerFn(placeOrder);
  const abandon = useServerFn(logAbandonedCart);

  // Customer
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [preferredContact, setPreferredContact] = useState<Contact>("telegram");

  // Delivery
  const [carrier, setCarrier] = useState<Carrier>("nova_poshta");
  const [city, setCity] = useState("");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("branch");
  const [branchAddress, setBranchAddress] = useState("");

  // Recipient toggle
  const [sameRecipient, setSameRecipient] = useState(true);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");

  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Abandoned cart: log a snapshot 8s after reaching checkout if not submitted
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    if (items.length === 0 || logged) return;
    const t = setTimeout(() => {
      const contact = phone || email;
      if (contact && !logged) {
        abandon({ data: { contact, items, itemsTotal: subtotal } }).catch(() => {});
        setLogged(true);
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [phone, email, items, subtotal, abandon, logged]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl">Кошик порожній</h1>
        <Link to="/shop" className="mt-6 inline-block text-accent underline">До магазину</Link>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!name.trim() || !phone.trim() || !city.trim() || !branchAddress.trim()) {
      toast.error("Заповніть, будь ласка, обовʼязкові поля.");
      return;
    }
    if (!sameRecipient && (!recipientName.trim() || !recipientPhone.trim())) {
      toast.error("Вкажіть імʼя та телефон отримувача.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await place({
        data: {
          customer: { name, phone, email, preferredContact },
          delivery: { carrier, city, deliveryType, branchAddress },
          recipient: {
            sameAsCustomer: sameRecipient,
            name: sameRecipient ? undefined : recipientName,
            phone: sameRecipient ? undefined : recipientPhone,
          },
          items,
          itemsTotal: subtotal,
          comment: comment.trim() || undefined,
        },
      });
      // remember last order for "повторити замовлення"
      try {
        localStorage.setItem(
          "sm.lastOrder.v1",
          JSON.stringify({ orderNumber: result.orderNumber, lines })
        );
      } catch {}
      clear();
      navigate({ to: "/order/$orderNumber", params: { orderNumber: result.orderNumber } });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Не вдалося оформити замовлення.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="container mx-auto grid gap-10 px-4 py-12 lg:grid-cols-[1fr_380px]">
      <form onSubmit={onSubmit} className="space-y-12">
        <header>
          <h1 className="text-4xl">Оформлення замовлення</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Оплата узгоджується менеджером після оформлення. Доставка оплачується окремо при отриманні.
          </p>
        </header>

        {/* Step 1: Customer */}
        <section>
          <SectionHeader step={1} icon={<User className="h-4 w-4" />} title="Ваші дані" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Імʼя та прізвище *">
              <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className={inputCls} />
            </Field>
            <Field label="Телефон *">
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required maxLength={40} placeholder="+380 ..." className={inputCls} />
            </Field>
            <Field label="Email (необовʼязково)">
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={255} className={inputCls} />
            </Field>
          </div>
        </section>

        {/* Step 2: Delivery */}
        <section>
          <SectionHeader step={2} icon={<Truck className="h-4 w-4" />} title="Доставка" />
          <div className="grid gap-3 sm:grid-cols-2 mb-5">
            {carriers.map((c) => {
              const active = carrier === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setCarrier(c.id)}
                  className={`rounded-sm border p-4 text-left transition ${active ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"}`}
                >
                  <div className="font-serif text-lg">{c.label}</div>
                  <div className="text-xs text-muted-foreground">{c.subtitle}</div>
                </button>
              );
            })}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Місто *">
              <input value={city} onChange={(e) => setCity(e.target.value)} required maxLength={120} className={inputCls} />
            </Field>
            <Field label="Тип точки видачі">
              <div className="flex gap-2">
                {(["branch", "locker"] as const).map((t) => {
                  if (carrier === "ukrposhta" && t === "locker") return null;
                  const active = deliveryType === t;
                  return (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setDeliveryType(t)}
                      className={`flex-1 rounded-sm border px-4 py-2 text-sm transition ${active ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"}`}
                    >
                      {t === "branch" ? "Відділення" : "Поштомат"}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label={`Номер ${deliveryType === "locker" ? "поштомата" : "відділення"} / адреса *`} className="sm:col-span-2">
              <input value={branchAddress} onChange={(e) => setBranchAddress(e.target.value)} required maxLength={200} placeholder="напр. №17 на вул. Хрещатик 22" className={inputCls} />
            </Field>
          </div>

          <div className="mt-4 rounded-sm bg-secondary p-4 text-xs text-muted-foreground flex gap-3">
            <Truck className="h-4 w-4 mt-0.5 shrink-0" />
            <span>Вартість доставки оплачується окремо при отриманні посилки у відділенні.</span>
          </div>
        </section>

        {/* Step 3: Recipient */}
        <section>
          <SectionHeader step={3} icon={<User className="h-4 w-4" />} title="Отримувач" />
          <div className="grid gap-3 sm:grid-cols-2 mb-4">
            <button
              type="button"
              onClick={() => setSameRecipient(true)}
              className={`rounded-sm border p-4 text-left transition ${sameRecipient ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"}`}
            >
              <div className="flex items-center gap-2 font-medium">
                {sameRecipient && <Check className="h-4 w-4 text-accent" />} Я отримувач
              </div>
              <div className="text-xs text-muted-foreground mt-1">Використати дані замовника</div>
            </button>
            <button
              type="button"
              onClick={() => setSameRecipient(false)}
              className={`rounded-sm border p-4 text-left transition ${!sameRecipient ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"}`}
            >
              <div className="flex items-center gap-2 font-medium">
                {!sameRecipient && <Check className="h-4 w-4 text-accent" />} Інший отримувач
              </div>
              <div className="text-xs text-muted-foreground mt-1">Подарунок або інша людина</div>
            </button>
          </div>
          {!sameRecipient && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Імʼя отримувача *">
                <input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} maxLength={120} className={inputCls} />
              </Field>
              <Field label="Телефон отримувача *">
                <input value={recipientPhone} onChange={(e) => setRecipientPhone(e.target.value)} maxLength={40} className={inputCls} />
              </Field>
            </div>
          )}
        </section>

        {/* Step 4: Contact / payment */}
        <section>
          <SectionHeader step={4} icon={<MessageCircle className="h-4 w-4" />} title="Оплата та звʼязок" />
          <div className="rounded-sm border border-border bg-card p-4 mb-4 text-sm">
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 mt-0.5 text-accent" />
              <div>
                <div className="font-medium">Оплата узгоджується менеджером</div>
                <div className="text-muted-foreground text-xs mt-1">
                  Після оформлення з вами звʼяжеться менеджер для підтвердження замовлення та узгодження зручного способу оплати.
                </div>
              </div>
            </div>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-foreground/60 mb-3">Зручний канал звʼязку</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {contacts.map((c) => {
              const active = preferredContact === c.id;
              return (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setPreferredContact(c.id)}
                  className={`rounded-sm border px-3 py-3 text-sm transition ${active ? "border-accent bg-accent/5" : "border-border hover:border-accent/60"}`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          <Field label="Коментар до замовлення" className="mt-6">
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={3} className={inputCls} />
          </Field>
        </section>
      </form>

      <aside className="h-fit rounded-sm border border-border bg-card p-6 lg:sticky lg:top-32">
        <h2 className="font-serif text-2xl mb-4">Ваше замовлення</h2>
        <ul className="divide-y divide-border text-sm">
          {items.map((it, i) => (
            <li key={i} className="py-3">
              <div className="flex justify-between gap-3">
                <span className="font-medium">{it.name}</span>
                <span className="shrink-0">{it.lineTotal} ₴</span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {it.packLabel}
                {it.weight && ` · ${it.weight}`}
                {` · ×${it.qty}`}
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 border-t border-border pt-4 flex justify-between font-serif text-xl">
          <span>Разом за товари</span><span>{subtotal} ₴</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Доставка оплачується окремо при отриманні.
        </p>
        <button
          onClick={onSubmit}
          disabled={submitting}
          type="button"
          className="mt-5 w-full rounded-sm bg-accent py-4 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-60"
        >
          {submitting ? "Оформлюємо..." : "Підтвердити замовлення"}
        </button>
      </aside>
    </div>
  );
}

const inputCls =
  "w-full rounded-sm border border-border bg-background px-3 py-2.5 text-sm focus:border-accent focus:outline-none";

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-xs uppercase tracking-[0.15em] text-foreground/60">{label}</span>
      {children}
    </label>
  );
}

function SectionHeader({ step, icon, title }: { step: number; icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <span className="grid h-8 w-8 place-items-center rounded-full bg-accent text-accent-foreground text-sm font-medium">
        {step}
      </span>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
    </div>
  );
}