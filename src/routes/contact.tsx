import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, MapPin } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Контакти — Spice Market" },
      {
        name: "description",
        content: "Зв'яжіться зі Spice Market: пошта, телефон, шоурум у Києві.",
      },
      { property: "og:title", content: "Контакти — Spice Market" },
      {
        property: "og:description",
        content: "Зв'яжіться зі Spice Market: пошта, телефон, шоурум у Києві.",
      },
      { property: "og:url", content: "/contact" },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "LocalBusiness",
          name: "Spice Market",
          url: "/",
          email: "hello@spicemarket.ua",
          address: {
            "@type": "PostalAddress",
            streetAddress: "вул. Хрещатик 22",
            addressLocality: "Київ",
            addressCountry: "UA",
          },
          telephone: "+380 (44) 555-12-34",
          openingHours: "Mo-Sa",
        }),
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <div className="container mx-auto grid gap-12 px-4 py-16 lg:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-accent">Зв'язок</p>
        <h1 className="mt-3 text-5xl">Напишіть нам</h1>
        <p className="mt-4 text-foreground/75 max-w-md">
          Відповідаємо протягом дня, з понеділка по суботу. Для оптових запитів — окрема скринька.
        </p>
        <ul className="mt-10 space-y-5">
          <Item icon={<Mail className="h-5 w-5" />} title="Email" value="hello@spicemarket.ua" />
          <Item icon={<Phone className="h-5 w-5" />} title="Телефон" value="+380 (44) 555-12-34" />
          <Item
            icon={<MapPin className="h-5 w-5" />}
            title="Шоурум"
            value="Київ, вул. Хрещатик 22, пн–сб"
          />
        </ul>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          alert("Дякуємо! Ми зв'яжемося найближчим часом.");
        }}
        className="rounded-sm border border-border bg-card p-8 space-y-4"
      >
        <Field label="Ім'я" name="name" required />
        <Field label="Email" name="email" type="email" required />
        <Field label="Телефон" name="phone" />
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">
            Повідомлення
          </label>
          <textarea
            required
            rows={5}
            className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
          />
        </div>
        <button className="w-full rounded-sm bg-accent py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90">
          Надіслати
        </button>
      </form>
    </div>
  );
}

function Item({ icon, title, value }: { icon: React.ReactNode; title: string; value: string }) {
  return (
    <li className="flex items-start gap-4">
      <span className="grid h-10 w-10 place-items-center rounded-sm bg-secondary text-accent">
        {icon}
      </span>
      <div>
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{title}</div>
        <div className="text-foreground/90">{value}</div>
      </div>
    </li>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
      />
    </div>
  );
}
