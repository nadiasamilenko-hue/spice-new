import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const OrderItemSchema = z.object({
  slug: z.string().min(1).max(120),
  name: z.string().min(1).max(200),
  packLabel: z.string().max(80).optional().nullable(),
  weight: z.string().max(40).optional().nullable(),
  qty: z.number().int().min(1).max(99),
  unitPrice: z.number().int().min(0).max(1_000_000),
  lineTotal: z.number().int().min(0).max(10_000_000),
});

const PlaceOrderSchema = z.object({
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().min(5).max(40),
    email: z.string().trim().email().max(255).optional().or(z.literal("")),
    preferredContact: z.enum(["telegram", "viber", "whatsapp", "phone"]),
  }),
  delivery: z.object({
    carrier: z.enum(["nova_poshta", "ukrposhta"]),
    city: z.string().trim().min(2).max(120),
    deliveryType: z.enum(["branch", "locker"]),
    branchAddress: z.string().trim().min(1).max(200),
  }),
  recipient: z.object({
    sameAsCustomer: z.boolean(),
    name: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(40).optional(),
  }),
  items: z.array(OrderItemSchema).min(1).max(50),
  itemsTotal: z.number().int().min(1).max(10_000_000),
  comment: z.string().trim().max(500).optional(),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => PlaceOrderSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const recipientName = data.recipient.sameAsCustomer ? null : data.recipient.name || null;
    const recipientPhone = data.recipient.sameAsCustomer ? null : data.recipient.phone || null;

    // 1) create order
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: data.customer.name,
        customer_phone: data.customer.phone,
        customer_email: data.customer.email || null,
        preferred_contact: data.customer.preferredContact,
        carrier: data.delivery.carrier,
        city: data.delivery.city,
        delivery_type: data.delivery.deliveryType,
        branch_address: data.delivery.branchAddress,
        recipient_name: recipientName,
        recipient_phone: recipientPhone,
        items: data.items,
        items_total: data.itemsTotal,
        comment: data.comment || null,
      })
      .select("id, order_number")
      .single();
    if (orderErr || !order) {
      console.error("[placeOrder] insert order", orderErr);
      throw new Error("Не вдалося зберегти замовлення.");
    }

    // 2) lookup products by slug → ids
    const slugs = data.items.map((i) => i.slug);
    const { data: prods } = await supabaseAdmin
      .from("products")
      .select("id, slug")
      .in("slug", slugs);
    const idBySlug = new Map((prods ?? []).map((p) => [p.slug as string, p.id as string]));

    // 3) insert order_items
    const itemRows = data.items.map((i) => ({
      order_id: order.id,
      product_id: idBySlug.get(i.slug) ?? null,
      slug: i.slug,
      name: i.name,
      pack_label: i.packLabel,
      weight: i.weight,
      qty: i.qty,
      unit_price: i.unitPrice,
      line_total: i.lineTotal,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(itemRows);
    if (itemsErr) console.error("[placeOrder] insert items", itemsErr);

    // 4) decrement stock
    for (const it of data.items) {
      const pid = idBySlug.get(it.slug);
      if (!pid) continue;
      await supabaseAdmin.rpc("decrement_stock", { _product_id: pid, _qty: it.qty });
    }

    // 5) upsert customer
    await supabaseAdmin.from("customers").upsert(
      {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || null,
        preferred_contact: data.customer.preferredContact,
        last_order_at: new Date().toISOString(),
      },
      { onConflict: "phone" },
    );
    // (no-op)
    // increment stats
    const { data: cust } = await supabaseAdmin
      .from("customers")
      .select("id, total_orders, total_spent")
      .eq("phone", data.customer.phone)
      .maybeSingle();
    if (cust) {
      await supabaseAdmin
        .from("customers")
        .update({
          total_orders: (cust.total_orders ?? 0) + 1,
          total_spent: (cust.total_spent ?? 0) + data.itemsTotal,
        })
        .eq("id", cust.id);
    }

    console.log(`[NEW ORDER] ${order.order_number} · ${data.customer.name} · ${data.itemsTotal} ₴`);
    return { id: order.id as string, orderNumber: order.order_number as string };
  });

const AbandonCartSchema = z.object({
  contact: z.string().trim().max(255).optional(),
  items: z.array(OrderItemSchema).min(1).max(50),
  itemsTotal: z.number().int().min(1).max(10_000_000),
});

export const logAbandonedCart = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => AbandonCartSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("abandoned_carts").insert({
      contact: data.contact || null,
      items: data.items,
      items_total: data.itemsTotal,
    });
    return { ok: true };
  });
