import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: admin role required");
}

export const isCurrentUserAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data, userId: context.userId };
  });

export const listAdminProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("products")
      .select("id,slug,name,price,image_url,visible,quantity,stock_status,sort_order")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getAdminProduct = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("products")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Not found");
    return row;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).optional().nullable(),
  price: z.number().min(0).max(1_000_000).optional(),
  quantity: z.number().int().min(0).max(1_000_000).optional(),
  visible: z.boolean().optional(),
  image_url: z.string().url().max(2048).optional().nullable(),
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  weight: z.string().max(80).optional().nullable(),
  pack_label: z.string().max(120).optional().nullable(),
  ingredients: z.string().max(5000).optional().nullable(),
  seo_title: z.string().max(255).optional().nullable(),
  seo_description: z.string().max(500).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
});

export const updateAdminProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => updateSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("products").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listAdminCategories = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select("id,slug,title")
      .order("title", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const listProductImages = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ productId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("product_images")
      .select("id,url,storage_path,is_primary,sort_order")
      .eq("product_id", data.productId)
      .order("is_primary", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const galleryUploadSchema = z.object({
  productId: z.string().uuid(),
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|avif)$/),
  dataBase64: z.string().min(1).max(7_500_000),
});

export const addProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => galleryUploadSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.length > 5 * 1024 * 1024) throw new Error("Файл понад 5MB");

    const ext = data.filename.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${data.productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    const url = pub.publicUrl;

    const { count } = await supabaseAdmin
      .from("product_images")
      .select("id", { count: "exact", head: true })
      .eq("product_id", data.productId);
    const isFirst = (count ?? 0) === 0;

    const { data: inserted, error: insErr } = await supabaseAdmin
      .from("product_images")
      .insert({
        product_id: data.productId,
        url,
        storage_path: path,
        is_primary: isFirst,
        sort_order: count ?? 0,
      })
      .select("id,url,storage_path,is_primary,sort_order")
      .single();
    if (insErr) throw new Error(insErr.message);

    if (isFirst) {
      await supabaseAdmin.from("products").update({ image_url: url }).eq("id", data.productId);
    }

    return inserted;
  });

export const setPrimaryProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid(), imageId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Unset previous primary first to satisfy unique partial index
    const { error: unsetErr } = await supabaseAdmin
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", data.productId)
      .eq("is_primary", true);
    if (unsetErr) throw new Error(unsetErr.message);

    const { data: row, error } = await supabaseAdmin
      .from("product_images")
      .update({ is_primary: true })
      .eq("id", data.imageId)
      .eq("product_id", data.productId)
      .select("url")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("products").update({ image_url: row.url }).eq("id", data.productId);

    return { ok: true };
  });

export const deleteProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ productId: z.string().uuid(), imageId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: img, error: getErr } = await supabaseAdmin
      .from("product_images")
      .select("storage_path,is_primary")
      .eq("id", data.imageId)
      .eq("product_id", data.productId)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!img) throw new Error("Зображення не знайдено");

    if (img.storage_path) {
      await supabaseAdmin.storage.from("product-images").remove([img.storage_path]);
    }

    const { error: delErr } = await supabaseAdmin
      .from("product_images")
      .delete()
      .eq("id", data.imageId);
    if (delErr) throw new Error(delErr.message);

    if (img.is_primary) {
      const { data: next } = await supabaseAdmin
        .from("product_images")
        .select("id,url")
        .eq("product_id", data.productId)
        .order("sort_order", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (next) {
        await supabaseAdmin.from("product_images").update({ is_primary: true }).eq("id", next.id);
        await supabaseAdmin
          .from("products")
          .update({ image_url: next.url })
          .eq("id", data.productId);
      } else {
        await supabaseAdmin.from("products").update({ image_url: null }).eq("id", data.productId);
      }
    }

    return { ok: true };
  });

const uploadSchema = z.object({
  productId: z.string().uuid(),
  filename: z
    .string()
    .min(1)
    .max(200)
    .regex(/^[a-zA-Z0-9._-]+$/),
  contentType: z.string().regex(/^image\/(jpeg|png|webp|gif|avif)$/),
  // base64-encoded file bytes (no data: prefix); cap ~7MB base64 (~5MB binary)
  dataBase64: z.string().min(1).max(7_500_000),
});

export const uploadProductImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => uploadSchema.parse(i))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const bytes = Buffer.from(data.dataBase64, "base64");
    if (bytes.length > 5 * 1024 * 1024) throw new Error("Файл понад 5MB");

    const ext = data.filename.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${data.productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from("product-images")
      .upload(path, bytes, { contentType: data.contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    // Public URL — bucket is public, stable forever
    const { data: pub } = supabaseAdmin.storage.from("product-images").getPublicUrl(path);
    const publicUrl = pub.publicUrl;

    const { error: updErr } = await supabaseAdmin
      .from("products")
      .update({ image_url: publicUrl })
      .eq("id", data.productId);
    if (updErr) throw new Error(updErr.message);

    return { url: publicUrl, path };
  });
