-- =============================================================
-- seed_image_urls.sql
-- Прив'язує image_url до продуктів після завантаження файлів
-- у Supabase Storage bucket "product-images".
--
-- ПОРЯДОК ДІЙ:
-- 1. Відкрий Supabase Dashboard → Storage → product-images
-- 2. Завантаж файли з src/assets/ (перейменуй як вказано нижче)
-- 3. Зайди в SQL Editor і виконай цей файл
-- =============================================================

-- Файли в bucket "product-images" → назви:
--   p-cinnamon.jpg
--   p-curry.jpg
--   p-paprika.jpg
--   p-pepper.jpg
--   p-tea.jpg
--   p-giftset.jpg
--   hero-spices.jpg   (для hero-секції, не для продуктів)

-- Замін YOUR_PROJECT_ID на реальний ID проєкту Supabase
-- (видно в Settings → General → Reference ID, або в .env як SUPABASE_PROJECT_ID)

DO $$
DECLARE
  base_url TEXT := 'https://cijtojgruikkwncdcrjm.supabase.co/storage/v1/object/public/product-images/';
BEGIN

  -- Оновлюємо image_url тільки для тих рядків де він ще порожній або null.
  -- Якщо image_url вже заповнений (напр. через адмінку) — не чіпаємо.

  UPDATE public.products
  SET image_url = base_url || 'p-cinnamon.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%cinnamon%' OR slug ILIKE '%koryts%' OR name ILIKE '%кориц%');

  UPDATE public.products
  SET image_url = base_url || 'p-curry.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%curry%' OR slug ILIKE '%kari%' OR name ILIKE '%каррі%' OR name ILIKE '%curry%');

  UPDATE public.products
  SET image_url = base_url || 'p-paprika.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%paprika%' OR name ILIKE '%паприк%');

  UPDATE public.products
  SET image_url = base_url || 'p-pepper.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%pepper%' OR slug ILIKE '%perets%' OR name ILIKE '%перець%' OR name ILIKE '%чорний перець%');

  UPDATE public.products
  SET image_url = base_url || 'p-tea.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%tea%' OR slug ILIKE '%chai%' OR name ILIKE '%чай%');

  UPDATE public.products
  SET image_url = base_url || 'p-giftset.jpg'
  WHERE (image_url IS NULL OR image_url = '')
    AND (slug ILIKE '%gift%' OR slug ILIKE '%nabir%' OR name ILIKE '%набір%' OR name ILIKE '%подарунк%');

END $$;

-- Перевірка після виконання — покажи всі продукти і їх image_url
SELECT slug, name, image_url
FROM public.products
ORDER BY sort_order;
