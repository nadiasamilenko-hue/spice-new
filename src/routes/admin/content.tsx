import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  getHomeContent,
  updateHomeContent,
  uploadHeroImage,
  HOME_DEFAULTS,
  type HomeContent,
} from "@/lib/site-content.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/content")({
  ssr: false,
  component: AdminContent,
});

function AdminContent() {
  const fetchContent = useServerFn(getHomeContent);
  const saveContent = useServerFn(updateHomeContent);
  const uploadImage = useServerFn(uploadHeroImage);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "home-content"],
    queryFn: () => fetchContent(),
  });
  const [draft, setDraft] = useState<HomeContent>(HOME_DEFAULTS);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (data) setDraft(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () => saveContent({ data: draft }),
    onSuccess: () => {
      toast.success("Збережено");
      qc.invalidateQueries({ queryKey: ["home-content"] });
      qc.invalidateQueries({ queryKey: ["admin", "home-content"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function onFile(file: File) {
    setUploading(true);
    try {
      const buf = await file.arrayBuffer();
      const b64 = btoa(String.fromCharCode(...new Uint8Array(buf)));
      const res = await uploadImage({
        data: {
          filename: file.name.replace(/[^a-zA-Z0-9._-]/g, "_"),
          contentType: file.type,
          dataBase64: b64,
        },
      });
      setDraft((d) => ({ ...d, hero: { ...d.hero, image: res.url } }));
      toast.success("Зображення завантажено");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <p className="text-muted-foreground">Завантаження…</p>;

  const hero = draft.hero;
  const s = draft.sections;
  const v = draft.visibility;

  return (
    <div className="space-y-10 max-w-3xl">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Контент головної сторінки</h2>
        <Link to="/admin" className="text-sm text-muted-foreground hover:text-foreground">
          ← Товари
        </Link>
      </div>

      <section className="space-y-4 rounded-sm border border-border p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg">Головний банер</h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="v-hero" className="text-sm text-muted-foreground">
              Показувати
            </Label>
            <Switch
              id="v-hero"
              checked={v.hero}
              onCheckedChange={(c) => setDraft({ ...draft, visibility: { ...v, hero: c } })}
            />
          </div>
        </div>
        <div className="grid gap-3">
          <div>
            <Label>Зображення банера</Label>
            {hero.image && (
              <img src={hero.image} alt="" className="mt-2 h-40 w-full rounded-sm object-cover" />
            )}
            <Input
              type="file"
              accept="image/*"
              className="mt-2"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFile(f);
              }}
            />
            {hero.image && (
              <button
                type="button"
                className="mt-2 text-xs text-muted-foreground underline"
                onClick={() => setDraft({ ...draft, hero: { ...hero, image: null } })}
              >
                Прибрати власне зображення (повернути стандартне)
              </button>
            )}
          </div>
          <div>
            <Label>Надпис (eyebrow)</Label>
            <Input
              value={hero.eyebrow}
              onChange={(e) => setDraft({ ...draft, hero: { ...hero, eyebrow: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Заголовок</Label>
              <Input
                value={hero.title}
                onChange={(e) => setDraft({ ...draft, hero: { ...hero, title: e.target.value } })}
              />
            </div>
            <div>
              <Label>Акцентоване слово</Label>
              <Input
                value={hero.titleAccent}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...hero, titleAccent: e.target.value } })
                }
              />
            </div>
          </div>
          <div>
            <Label>Підзаголовок</Label>
            <Textarea
              value={hero.subtitle}
              onChange={(e) => setDraft({ ...draft, hero: { ...hero, subtitle: e.target.value } })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Кнопка 1</Label>
              <Input
                value={hero.ctaPrimary}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...hero, ctaPrimary: e.target.value } })
                }
              />
            </div>
            <div>
              <Label>Кнопка 2</Label>
              <Input
                value={hero.ctaSecondary}
                onChange={(e) =>
                  setDraft({ ...draft, hero: { ...hero, ctaSecondary: e.target.value } })
                }
              />
            </div>
          </div>
        </div>
      </section>

      {(
        [
          ["categories", "Секція «Категорії»", "categoriesEyebrow", "categoriesTitle"],
          ["purposes", "Секція «Підбір за стравою»", "purposesEyebrow", "purposesTitle"],
          ["best", "Секція «Бестселери»", "bestEyebrow", "bestTitle"],
          ["packs", "Секція «Пакування»", "packsEyebrow", "packsTitle"],
          ["latest", "Секція «Новинки»", "latestEyebrow", "latestTitle"],
        ] as const
      ).map(([key, label, ey, ti]) => (
        <section key={key} className="space-y-4 rounded-sm border border-border p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg">{label}</h3>
            <div className="flex items-center gap-2">
              <Label htmlFor={`v-${key}`} className="text-sm text-muted-foreground">
                Показувати
              </Label>
              <Switch
                id={`v-${key}`}
                checked={v[key]}
                onCheckedChange={(c) => setDraft({ ...draft, visibility: { ...v, [key]: c } })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Надпис</Label>
              <Input
                value={s[ey]}
                onChange={(e) => setDraft({ ...draft, sections: { ...s, [ey]: e.target.value } })}
              />
            </div>
            <div>
              <Label>Заголовок</Label>
              <Input
                value={s[ti]}
                onChange={(e) => setDraft({ ...draft, sections: { ...s, [ti]: e.target.value } })}
              />
            </div>
          </div>
        </section>
      ))}

      <div className="sticky bottom-4 flex justify-end gap-2 rounded-sm border border-border bg-background/90 p-3 backdrop-blur">
        <Button variant="outline" onClick={() => data && setDraft(data)}>
          Скинути
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "Збереження…" : "Зберегти"}
        </Button>
      </div>
    </div>
  );
}
