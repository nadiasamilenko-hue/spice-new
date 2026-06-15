import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type HomeContent = {
  hero: {
    eyebrow: string;
    title: string;
    titleAccent: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    image: string | null;
  };
  sections: {
    categoriesTitle: string;
    categoriesEyebrow: string;
    purposesTitle: string;
    purposesEyebrow: string;
    bestTitle: string;
    bestEyebrow: string;
    packsTitle: string;
    packsEyebrow: string;
    latestTitle: string;
    latestEyebrow: string;
  };
  visibility: {
    hero: boolean;
    categories: boolean;
    purposes: boolean;
    best: boolean;
    packs: boolean;
    latest: boolean;
  };
};

export const HOME_DEFAULTS: HomeContent = {
  hero: {
    eyebrow: "Spice Market · Україна",
    title: "Аромати, які",
    titleAccent: "роблять",
    subtitle: "Преміальні спеції, авторські суміші та чаї для щоденної кухні.",
    ctaPrimary: "Перейти до магазину",
    ctaSecondary: "Авторські суміші",
    image: null,
  },
  sections: {
    categoriesEyebrow: "Категорії",
    categoriesTitle: "З чого почати",
    purposesEyebrow: "Підбір за стравою",
    purposesTitle: "Що готуєте сьогодні?",
    bestEyebrow: "Бестселери",
    bestTitle: "Що замовляють найчастіше",
    packsEyebrow: "Пакування",
    packsTitle: "Оберіть свій формат",
    latestEyebrow: "Новинки",
    latestTitle: "Тільки прийшли",
  },
  visibility: {
    hero: true,
    categories: true,
    purposes: true,
    best: true,
    packs: true,
    latest: true,
  },
};

function merge(value: unknown): HomeContent {
  const v = value && typeof value === "object" ? (value as Partial<HomeContent>) : {};
  return {
    hero: { ...HOME_DEFAULTS.hero, ...(v.hero ?? {}) },
    sections: { ...HOME_DEFAULTS.sections, ...(v.sections ?? {}) },
    visibility: { ...HOME_DEFAULTS.visibility, ...(v.visibility ?? {}) },
  };
}

export const getHomeContent = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "home")
    .maybeSingle();
  return merge(data?.value);
});

const homeSchema = z.object({
  hero: z.object({
    eyebrow: z.string().max(120),
    title: z.string().max(200),
    titleAccent: z.string().max(80),
    subtitle: z.string().max(400),
    ctaPrimary: z.string().max(80),
    ctaSecondary: z.string().max(80),
    image: z.string().url().max(2048).nullable(),
  }),
  sections: z.object({
    categoriesEyebrow: z.string().max(120),
    categoriesTitle: z.string().max(200),
    purposesEyebrow: z.string().max(120),
    purposesTitle: z.string().max(200),
    bestEyebrow: z.string().max(120),
    bestTitle: z.string().max(200),
    packsEyebrow: z.string().max(120),
    packsTitle: z.string().max(200),
    latestEyebrow: z.string().max(120),
    latestTitle: z.string().max(200),
  }),
  visibility: z.object({
    hero: z.boolean(),
    categories: z.boolean(),
    purposes: z.boolean(),
    best: z.boolean(),
    packs: z.boolean(),
    latest: z.boolean(),
  }),
});

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin role required");
}

export const updateHomeContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => homeSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("site_settings")
      .upsert(
        { key: "home", value: data as unknown as Record<string, unknown> },
        { onConflict: "key" },
      );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const uploadSchema = z.object({
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|avif)$/),
  dataBase64: z.string().min(1).max(10_000_000),
});

export const uploadHeroImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => uploadSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.length > 7 * 1024 * 1024) throw new Error("Файл понад 7MB");
    const ext = data.filename.split(".").pop()?.toLowerCase() || "jpg";
    const path = `site/hero-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    return { url: pub.publicUrl };
  });
