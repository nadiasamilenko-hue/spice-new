# Spice Market

Інтернет-вітрина спецій, чаїв та сумішей. Замовлення оформлюються без онлайн-оплати —
менеджер зв'язується з клієнтом обраним каналом (Telegram / Viber / WhatsApp / дзвінок).

**Стек:** TanStack Start (React 19, SSR) · Tailwind CSS v4 · Supabase (Postgres + Auth + Storage) ·
Bun · збірка через Nitro (типовий таргет — Cloudflare).

---

## 1. Передумови

- [Bun](https://bun.sh) (проєкт містить `bun.lock`).
- Власний проєкт [Supabase](https://supabase.com).
- (Опційно) [Supabase CLI](https://supabase.com/docs/guides/cli) для застосування міграцій.

## 2. Налаштування оточення

Скопіюйте `.env.example` у `.env` і заповніть значеннями зі **свого** Supabase-проєкту
(Dashboard → Settings → API):

```
SUPABASE_URL=...                  # Project URL
SUPABASE_PUBLISHABLE_KEY=...      # anon / publishable key
SUPABASE_SERVICE_ROLE_KEY=...     # ⚠️ секрет, лише на сервері — НЕ у VITE_*
SUPABASE_PROJECT_ID=...

VITE_SUPABASE_URL=...             # дублює SUPABASE_URL (потрапляє у клієнт)
VITE_SUPABASE_PUBLISHABLE_KEY=... # дублює anon key (потрапляє у клієнт)
VITE_SUPABASE_PROJECT_ID=...
VITE_SITE_URL=https://ваш-домен  # без слешу в кінці; для абсолютних og:url / og:image
```

> **Безпека.** `.env` не комітьте у git (він не має потрапляти у репозиторій).
> `SUPABASE_SERVICE_ROLE_KEY` дає повний доступ в обхід RLS — тримайте лише на сервері
> й ніколи не давайте йому префікс `VITE_`. Якщо ключі колись потрапили в чужі руки —
> перевипустіть їх у Supabase.

## 3. База даних (міграції)

Застосуйте всі файли з `supabase/migrations/` у хронологічному порядку.

Через CLI:

```bash
supabase link --project-ref <PROJECT_ID>
supabase db push
```

Або вручну: відкрийте кожен `.sql` із `supabase/migrations/` у Dashboard → SQL Editor
і виконайте по черзі (за зростанням дати у назві).

Сід (`20260611000001_seed_products.sql`) наповнює каталог (~330 позицій), а наступний
`20260611000002_fix_categories.sql` розкладає товари по правильних категоріях.

## 4. Перший адміністратор (обов'язково)

Адмін-панель (`/admin`) відкривається лише користувачам із роллю `admin`. Роль не видається
автоматично — її треба призначити вручну **один раз**:

1. Запустіть сайт і зареєструйтесь на `/auth` (email + пароль).
2. У Supabase Dashboard → SQL Editor знайдіть свій `user_id`:
   ```sql
   select id, email from auth.users;
   ```
3. Призначте роль:
   ```sql
   insert into public.user_roles (user_id, role)
   values ('ВАШ-USER-UUID', 'admin')
   on conflict (user_id, role) do nothing;
   ```
4. Перезайдіть і відкрийте `/admin` (швидкий вхід — `/admin-entry`).

## 5. Запуск

```bash
bun install
bun run dev        # локальна розробка
bun run build      # продакшн-збірка (Nitro, типовий таргет — Cloudflare)
bun run preview    # перегляд зібраного
bun run lint       # ESLint
```

---

## Що було виправлено в цій версії

- **Каталог «Чисті спеції»** більше не порожній: сід прив'язував моно-спеції до
  неіснуючої категорії `mono` (тепер — `clean`).
- **Авторські суміші** винесено в окрему категорію `Авторські суміші` (`author`)
  замість «Подарункових наборів».
- Виправлено падіння сторінки `/shop` на SSR (невизначена змінна `q` у `head()`).
- Навігацію та головну сторінку приведено у відповідність до нових категорій.

## Що варто доробити перед «бойовим» запуском

- **Фото товарів.** Зараз `image_url` веде на тимчасові зображення Unsplash. Завантажте
  реальні фото через адмінку (Товари → редагування) — вони підуть у Storage-бакет
  `product-images`.
- **Описи та інгредієнти.** Усі описи зараз шаблонні («— авторська спеція Spice Market»).
- **Ціни.** ~32 позиції мають порожню ціну й показуються як `0 ₴` — проставте їх в адмінці.
- **Категорія «Подарункові набори»** (`gift`) залишена в схемі, але порожня. Коли з'являться
  реальні набори — додайте їх і поверніть пункт у меню (`src/components/Header.tsx`) та на
  головну (масив `categories` у `src/lib/products.ts`).
- **`VITE_SITE_URL`** — підставте реальний домен, інакше SEO-прев'ю (og:image/og:url) будуть
  некоректні.
- **Заглушка `public/index.html`** і `public/files/example.pdf` — залишки шаблону, можна видалити.
- **Ціни замовлення** наразі приймаються з боку клієнта; за потреби варто перераховувати суму
  на сервері в `placeOrder` (`src/lib/orders.functions.ts`) із цін у БД.
