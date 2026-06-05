import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SLUG_RE = /^[a-z0-9-]+$/;

function mapRow(r: any) {
  const cat = (r.categories?.slug as string | undefined) || "other";
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    shortName: r.short_name as string | null,
    description: (r.description as string) ?? "",
    image: (r.image_url as string) || "/placeholder.svg",
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
