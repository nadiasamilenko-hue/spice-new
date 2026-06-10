import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Maps product slugs to local bundled assets (used as fallback when
 * image_url is not yet set in the database).
 *
 * HOW THIS WORKS:
 * - In production: products should have image_url pointing to Supabase Storage.
 *   This map is only a safety net during development / initial seeding.
 * - To migrate: upload the files from src/assets/ to the "product-images" bucket
 *   in Supabase Storage, then run the SQL migration from
 *   supabase/migrations/seed_image_urls.sql to populate image_url in the DB.
 *   Once all rows have image_url, this map is never reached.
 *
 * The key is a substring that appears in the product slug.
 * Order matters — first match wins.
 */
const SLUG_ASSET_MAP: Array<{ test: RegExp; asset: string }> = [
  { test: /cinnamon|кориця|corytsya/, asset: "/src/assets/p-cinnamon.jpg" },
  { test: /curry|каррі|kari/,         asset: "/src/assets/p-curry.jpg" },
  { test: /paprika|паприка/,          asset: "/src/assets/p-paprika.jpg" },
  { test: /pepper|перець|perets/,     asset: "/src/assets/p-pepper.jpg" },
  { test: /tea|чай|chai/,             asset: "/src/assets/p-tea.jpg" },
  { test: /gift|набір|nabir|set/,     asset: "/src/assets/p-giftset.jpg" },
];

/**
 * Returns the best image URL for a product:
 *   1. image_url from DB (Supabase Storage public URL) — preferred
 *   2. slug-matched local asset — fallback during dev / before seeding
 *   3. /placeholder.svg — last resort
 */
function resolveImage(imageUrl: string | null | undefined, slug: string): string {
  if (imageUrl) return imageUrl;
  const match = SLUG_ASSET_MAP.find(({ test }) => test.test(slug));
  return match ? match.asset : "/placeholder.svg";
}

function mapRow(r: any) {
  const cat = (r.categories?.slug as string | undefined) || "other";
  const slug = r.slug as string;
  return {
    id: r.id as string,
    slug,
    name: r.name as string,
    shortName: r.short_name as string | null,
    description: (r.description as string) ?? "",
    image: resolveImage(r.image_url as string | null, slug),
    category: (["clean", "blend", "tea", "gift"].includes(cat) ? cat : "other") as "clean" | "blend" | "tea" | "gift" | "other",
    categoryTitle: r.categories?.title ?? null,
    price: (r.price as number) ?? 0,
    weight: (r.weight as string) ?? null,
    packLabel: (r.pack_label as string) ?? null,
    tags: (r.tags as string[]) ?? [],
    badge: (r.badge as string) ?? null,
    visible: r.visible as boolean,
    quantity: (r.quantity as number) ?? 0,
    stockStatus: r.stock_status as "in_stock" | "low_stock" | "out_of_stock",
  };
}

export const listProducts = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z
      .object({
        category: z.string().max(40).optional(),
        search: z.string().max(120).optional(),
        pack: z.string().max(120).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(input ?? {})
  )
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    let q = supabase
      .from("products")
      .select("id,slug,name,short_name,description,image_url,price,weight,pack_label,tags,badge,visible,quantity,stock_status,sort_order,categories(slug,title)")
      .eq("visible", true)
      .order("sort_order", { ascending: true });
    if (data.category && data.category !== "all") {
      const { data: cat } = await supabase.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
    }
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.pack) q = q.eq("pack_label", data.pack);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return (rows ?? []).map(mapRow);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1).max(120).regex(SLUG_RE) }).parse(input))
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: row, error } = await supabase
      .from("products")
      .select("id,slug,name,short_name,description,image_url,price,weight,pack_label,tags,badge,visible,quantity,stock_status,categories(slug,title)")
      .eq("slug", data.slug)
      .eq("visible", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return mapRow(row);
  });

export const listAllSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase.from("products").select("slug,updated_at").eq("visible", true);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const listVariantsByName = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ name: z.string().min(1).max(200) }).parse(input))
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: rows, error } = await supabase
      .from("products")
      .select("slug,name,price,image_url,weight,pack_label,quantity,stock_status")
      .eq("visible", true)
      .eq("name", data.name);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r: any) => ({
      slug: r.slug as string,
      name: r.name as string,
      price: (r.price as number) ?? 0,
      image: resolveImage(r.image_url as string | null, r.slug as string),
      weight: (r.weight as string) ?? null,
      packLabel: (r.pack_label as string) ?? null,
      quantity: (r.quantity as number) ?? 0,
      stockStatus: r.stock_status as "in_stock" | "low_stock" | "out_of_stock",
    }));
  });
