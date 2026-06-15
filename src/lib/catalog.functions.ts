import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Product } from "@/lib/products";

const SLUG_RE = /^[a-z0-9-]+$/;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  weight: string | null;
  pack_label: string | null;
  tags: string[] | null;
  badge: string | null;
  visible: boolean;
  quantity: number | null;
  stock_status: Product["stockStatus"];
  categories?: { slug?: string | null; title?: string | null } | null;
};

type VariantRow = Pick<
  ProductRow,
  "slug" | "name" | "price" | "image_url" | "weight" | "pack_label" | "quantity" | "stock_status"
>;

function mapRow(r: ProductRow): Product {
  const cat = (r.categories?.slug as string | undefined) || "other";
  return {
    id: r.id as string,
    slug: r.slug as string,
    name: r.name as string,
    shortName: r.short_name as string | null,
    description: (r.description as string) ?? "",
    image: (r.image_url as string) || "/placeholder.svg",
    category: (["clean", "blend", "author", "tea", "gift"].includes(cat) ? cat : "other") as
      | "clean"
      | "blend"
      | "author"
      | "tea"
      | "gift"
      | "other",
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
      .parse(input ?? {}),
  )
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    let q = supabase
      .from("products")
      .select(
        "id,slug,name,short_name,description,image_url,price,weight,pack_label,tags,badge,visible,quantity,stock_status,sort_order,categories(slug,title)",
      )
      .eq("visible", true)
      .order("sort_order", { ascending: true });
    if (data.category && data.category !== "all") {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", data.category)
        .maybeSingle();
      if (cat?.id) q = q.eq("category_id", cat.id);
    }
    if (data.search) q = q.ilike("name", `%${data.search}%`);
    if (data.pack) q = q.eq("pack_label", data.pack);
    if (data.limit) q = q.limit(data.limit);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return ((rows ?? []) as ProductRow[]).map(mapRow);
  });

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1).max(120).regex(SLUG_RE) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: row, error } = await supabase
      .from("products")
      .select(
        "id,slug,name,short_name,description,image_url,price,weight,pack_label,tags,badge,visible,quantity,stock_status,categories(slug,title)",
      )
      .eq("slug", data.slug)
      .eq("visible", true)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return mapRow(row as ProductRow);
  });

export const listAllSlugs = createServerFn({ method: "GET" }).handler(async () => {
  const { supabase } = await import("@/integrations/supabase/client");
  const { data, error } = await supabase
    .from("products")
    .select("slug,updated_at")
    .eq("visible", true);
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
    return ((rows ?? []) as VariantRow[]).map((r) => ({
      slug: r.slug as string,
      name: r.name as string,
      price: (r.price as number) ?? 0,
      image: (r.image_url as string) || "/placeholder.svg",
      weight: (r.weight as string) ?? null,
      packLabel: (r.pack_label as string) ?? null,
      quantity: (r.quantity as number) ?? 0,
      stockStatus: r.stock_status as "in_stock" | "low_stock" | "out_of_stock",
    }));
  });
