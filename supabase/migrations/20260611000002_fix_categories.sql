-- Corrects two category-assignment bugs introduced by 20260611000001_seed_products.sql.
--
-- Bug 1 — Чисті спеції зникали з каталогу:
--   сід шукав категорію slug='mono', якої не існує (створено 'clean'),
--   тож ~130 моно-спецій отримали category_id = NULL і не показувались
--   у фільтрі «Чисті спеції».
--
-- Bug 2 — Авторські суміші лежали в «Подарункових наборах»:
--   сід складав їх у категорію slug='gift', через що вкладка
--   «Подарунки» показувала суміші спецій, а не подарункові набори.
--
-- Цей файл ідемпотентний: безпечно виконується повторно й на свіжій БД
-- (після сіду), і на вже наповненій.

-- 1) Окрема категорія для авторських сумішей.
INSERT INTO public.categories (slug, title, subtitle, sort_order) VALUES
  ('author', 'Авторські суміші', 'Фірмові купажі від шефа.', 25)
ON CONFLICT (slug) DO NOTHING;

DO $$
DECLARE
  cat_clean  uuid;
  cat_gift   uuid;
  cat_author uuid;
BEGIN
  SELECT id INTO cat_clean  FROM public.categories WHERE slug = 'clean';
  SELECT id INTO cat_gift   FROM public.categories WHERE slug = 'gift';
  SELECT id INTO cat_author FROM public.categories WHERE slug = 'author';

  -- 2) Моно-спеції: сід лишив їх без категорії (slug 'mono' не існував).
  --    Це єдині рядки з NULL-категорією, тож апдейт безпечний та ідемпотентний.
  UPDATE public.products
     SET category_id = cat_clean
   WHERE category_id IS NULL;

  -- 3) Переносимо авторські суміші з 'gift' до нової 'author'.
  --    Усе, що зараз у 'gift', — це авторські суміші (справжніх наборів
  --    ще не засіяно), тож категорія 'gift' звільняється під майбутні
  --    подарункові набори.
  UPDATE public.products
     SET category_id = cat_author
   WHERE category_id = cat_gift;
END $$;
