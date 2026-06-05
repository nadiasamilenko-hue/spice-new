import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const { data } = await supabaseAdmin.from("products").select("slug,updated_at").eq("visible", true);
        const base = "";
        const urls = [
          `<url><loc>${base}/</loc></url>`,
          `<url><loc>${base}/shop</loc></url>`,
          `<url><loc>${base}/about</loc></url>`,
          `<url><loc>${base}/contact</loc></url>`,
          ...(data ?? []).map((p) => `<url><loc>${base}/product/${p.slug}</loc><lastmod>${(p.updated_at as string).slice(0,10)}</lastmod></url>`),
        ];
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;
        return new Response(xml, { headers: { "content-type": "application/xml; charset=utf-8" } });
      },
    },
  },
});
