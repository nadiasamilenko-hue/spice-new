import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { getAdminProduct, updateAdminProduct, uploadProductImage } from "@/lib/admin.functions";

export const Route = createFileRoute("/admin/products/$id")({
  component: AdminProductEdit,
});

function AdminProductEdit() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => getAdminProduct({ data: { id } }),
  });

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [quantity, setQuantity] = useState(0);
  const [visible, setVisible] = useState(true);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setDescription(data.description ?? "");
    setPrice(Number(data.price ?? 0));
    setQuantity(Number(data.quantity ?? 0));
    setVisible(!!data.visible);
    setImageUrl(data.image_url ?? null);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      updateAdminProduct({
        data: { id, name, description, price, quantity, visible, image_url: imageUrl },
      }),
    onSuccess: () => {
      toast.success("Збережено");
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type)) {
      toast.error("Лише JPG, PNG, WEBP, AVIF, GIF");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Файл понад 5MB");
      return;
    }
    setUploading(true);
    try {
      const dataBase64 = await fileToBase64(file);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const res = await uploadProductImage({
        data: { productId: id, filename: safeName, contentType: file.type, dataBase64 },
      });
      setImageUrl(res.url);
      toast.success("Фото завантажено");
      qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Завантаження…</p>;
  if (error) return <p className="text-destructive">{(error as Error).message}</p>;

  return (
    <div className="max-w-3xl">
      <Link to="/admin" className="text-xs text-muted-foreground hover:text-accent">← Назад до товарів</Link>
      <h2 className="mt-2 text-2xl mb-6">Редагувати товар</h2>

      <div className="grid gap-8 md:grid-cols-[260px_1fr]">
        <div>
          <div className="aspect-square overflow-hidden rounded-sm border border-border bg-secondary">
            <img
              src={imageUrl || "/placeholder.svg"}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                if (!img.src.endsWith("/placeholder.svg")) img.src = "/placeholder.svg";
              }}
            />
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
            onChange={onPickFile}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="mt-3 w-full rounded-sm border border-border px-4 py-2 text-sm hover:border-accent disabled:opacity-50"
          >
            {uploading ? "Завантаження…" : imageUrl ? "Замінити фото" : "Завантажити фото"}
          </button>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="mt-2 w-full text-xs text-muted-foreground hover:text-destructive"
            >
              Видалити фото
            </button>
          )}
          <p className="mt-2 text-xs text-muted-foreground">JPG/PNG/WEBP до 5MB. Квадратний формат.</p>
        </div>

        <div className="space-y-4">
          <Field label="Назва">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </Field>
          <Field label="Опис">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} className="input" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ціна, ₴">
              <input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="input" />
            </Field>
            <Field label="Залишок">
              <input type="number" min={0} step="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input" />
            </Field>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
            <span className="text-sm">Видимий у каталозі</span>
          </label>

          <button
            type="button"
            disabled={save.isPending}
            onClick={() => save.mutate()}
            className="rounded-sm bg-accent px-6 py-3 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {save.isPending ? "Збереження…" : "Зберегти"}
          </button>
        </div>
      </div>

      <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:hsl(var(--background));padding:.6rem .75rem;border-radius:2px;font-size:.875rem;margin-top:.25rem}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result || "");
      const i = s.indexOf(",");
      resolve(i >= 0 ? s.slice(i + 1) : s);
    };
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}