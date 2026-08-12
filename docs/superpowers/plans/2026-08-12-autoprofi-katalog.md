# AUTOPROFI — ядро каталога

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Собрать работающий сайт-каталог: 8 238 статических страниц, построенных из базы по пяти шаблонам, с микроразметкой и картой сайта.

**Architecture:** Данные читаются из PGlite на этапе сборки — страницы генерируются статически через `generateStaticParams`. Слой запросов к каталогу отделён от компонентов: страницы получают готовые объекты и не знают про Drizzle. Чистые функции подписей и путей вынесены отдельно, потому что именно они дают самые частые ошибки (склонения, склейка кириллицы с латиницей) и должны покрываться тестами без поднятия базы.

**Tech Stack:** Next.js 16 (App Router), TypeScript strict, Tailwind CSS 4, Drizzle ORM, PGlite, Vitest.

## Global Constraints

- Персональные данные граждан РФ хранятся только на серверах в России (152-ФЗ ч.5 ст.18). Продакшен-БД — Timeweb Cloud. Supabase, Neon, Vercel Postgres запрещены
- Шрифты раздаются только со своего домена. Обращения к `fonts.googleapis.com` и любым внешним CDN запрещены — машина сборки до них не достучится, и это проверено
- TypeScript strict, `any` запрещён
- Все тексты на сайте на русском. Разметка `lang="ru"`
- Сообщения коммитов на русском, формат `тип: описание`
- Рабочая директория `E:\WEB\AUTOPROFI`, Windows, Git Bash
- Город в заголовке допустим только на главной и страницах услуг. На страницах каталога, марок, моделей, кузовов и товаров города быть НЕ должно — они работают на всю Россию
- Фильтры внутри страницы кузова не меняют URL

## Что уже готово

Подпроект «данные» влит в `master`. Доступно:

- Схема в `src/db/schema.ts`: таблицы `manufacturers`, `brands`, `models`, `variants`, `products`, `fitments`. Типы выводятся через `$inferSelect`
- `getDb()` в `src/db/client.ts` и `rowsOf<T>()` для сырых запросов
- `createTestDb()` в `src/db/test-helpers.ts` — чистая база в памяти с миграциями
- `importCatalog()` и `recalculateCounters()` — наполнение базы
- База лежит в `.pgdata/`, пересоздаётся командой `npm run import`
- `next.config.ts` содержит `serverExternalPackages: ['@electric-sql/pglite']` — без этого сборка падает на разрешении путей
- Установлены `@fontsource-variable/unbounded` и `@fontsource-variable/wix-madefor-text`, обе с кириллицей
- Дизайн-токены в `docs/design-tokens.md`, тексты-заглушки в `docs/content-placeholders.md`
- Макеты в `design/extracted/export/` — это React-бандлы, разметки в них нет, годятся только как эталон внешнего вида

## Контрольные числа

Сборка обязана выдать столько страниц. Это приёмочный критерий.

| Маршрут | Страниц |
|---|---:|
| `/farkopy/{марка}/` | 106 |
| `/farkopy/{марка}/{модель}/` | 956 |
| `/farkopy/{марка}/{модель}/{кузов}/` | 1 368 |
| `/tovar/{артикул}/` | 5 808 |
| **Итого из шаблонов** | **8 238** |
| Плюс `/`, `/farkopy/` | 2 |

---

## File Structure

| Файл | Ответственность |
|---|---|
| `src/app/globals.css` | Токены Tailwind: цвета, шрифты, радиусы |
| `src/app/layout.tsx` | Корневой layout, подключение шрифтов, метаданные |
| `src/catalog/format.ts` | Чистые функции текста: склонения, цены, годы, подписи |
| `src/catalog/urls.ts` | Построение путей. Единственное место, где живут адреса |
| `src/catalog/queries.ts` | Запросы к каталогу. Страницы не знают про Drizzle |
| `src/components/site-header.tsx` | Шапка: логотип, меню, телефон |
| `src/components/site-footer.tsx` | Подвал: колонки ссылок, контакты, юридические |
| `src/components/breadcrumbs.tsx` | Хлебные крошки с разметкой `BreadcrumbList` |
| `src/components/product-card.tsx` | Карточка товара в списке |
| `src/app/farkopy/page.tsx` | Указатель всех марок |
| `src/app/farkopy/[brand]/page.tsx` | Страница марки |
| `src/app/farkopy/[brand]/[model]/page.tsx` | Страница модели |
| `src/app/farkopy/[brand]/[model]/[variant]/page.tsx` | Страница кузова — основная посадочная |
| `src/app/tovar/[article]/page.tsx` | Карточка товара |
| `src/app/page.tsx` | Главная |
| `src/app/sitemap.ts` | Карта сайта |
| `src/app/robots.ts` | robots.txt |
| `scripts/check-build.ts` | Проверка сгенерированного HTML после сборки |

Разделение по ответственности: `format.ts` и `urls.ts` — чистые функции, тестируются без базы. `queries.ts` — единственный модуль, знающий про Drizzle. Компоненты получают готовые объекты.

---

## Task 1: Шрифты и токены оформления

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`

**Interfaces:**
- Produces: CSS-переменные Tailwind `--color-*`, `--font-display`, `--font-body`; классы `font-display` и `font-body`

- [ ] **Step 1: Прописать токены в globals.css**

Заменить содержимое `src/app/globals.css` целиком:

```css
@import 'tailwindcss';

@theme {
  /* Тёмная тема */
  --color-bg: #0a0a0b;
  --color-surface: #0e0e10;
  --color-surface-2: #141416;
  --color-surface-3: #1e1e21;
  --color-ink: #f5f4f2;
  --color-ink-muted: #8a8a88;
  --color-ink-dim: #6e6e6c;
  --color-line: #3a3a3e;

  /* Светлая тема */
  --color-paper: #f5f4f2;
  --color-paper-2: #efedea;
  --color-paper-3: #f7f6f4;
  --color-ink-dark: #141416;
  --color-line-light: #e7e5e1;

  /* Акцент */
  --color-accent: #d93a2b;
  --color-accent-hover: #e63329;
  --color-accent-bright: #ff5347;
  --color-accent-soft: #fff6f4;

  /* Наличие */
  --color-in-stock: #2c7a4b;
  --color-on-order: #9a5b08;

  --radius-card: 14px;
  --radius-block: 18px;
}

html {
  background: var(--color-bg);
  color: var(--color-ink);
}
```

- [ ] **Step 2: Подключить шрифты в layout**

Заменить `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'

/**
 * Шрифты берутся из пакетов Fontsource и раздаются со своего домена.
 *
 * Подключать их через next/font/google нельзя: машина сборки не имеет
 * доступа к fonts.googleapis.com, сборка падает. Внешние CDN в этом
 * проекте не используются и по соображениям скорости — обращение
 * к чужому хосту задерживает первую отрисовку.
 */
const display = localFont({
  src: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 900',
})

const body = localFont({
  src: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-cyrillic-wght-normal.woff2',
  variable: '--font-body',
  display: 'swap',
  weight: '400 800',
})

export const metadata: Metadata = {
  title: 'Фаркопы с установкой в Санкт-Петербурге — AUTOPROFI',
  description:
    'Подберём фаркоп по марке, модели и году. Установка за один визит с документами для ТО, доставка по России.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Проверить сборку**

Run: `npm run build`
Expected: `Compiled successfully`, без предупреждений про шрифты.

- [ ] **Step 4: Убедиться, что шрифты легли в статику**

Run: `ls .next/static/media/`
Expected: два файла `.woff2` — по одному на гарнитуру. Если пусто, шрифты не подключились.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: шрифты и токены оформления"
```

---

## Task 2: Форматирование текста

**Files:**
- Create: `src/catalog/format.ts`, `src/catalog/format.test.ts`

**Interfaces:**
- Produces:
  - `plural(n: number, one: string, few: string, many: string): string`
  - `formatCount(n: number, one: string, few: string, many: string): string` — число вместе со словом
  - `formatPrice(value: number): string`
  - `formatYears(from: number | null, to: number | null): string`
  - `formatVariantLabel(brand: string, model: string, generation: string | null, from: number | null, to: number | null): string`

- [ ] **Step 1: Написать падающие тесты**

Создать `src/catalog/format.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { formatCount, formatPrice, formatVariantLabel, formatYears, plural } from './format'

test('склонение по русским правилам', () => {
  expect(plural(1, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркоп')
  expect(plural(2, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопа')
  expect(plural(5, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопов')
  expect(plural(21, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркоп')
  expect(plural(0, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('фаркопов')
})

test('склонение на числах, где ошибаются чаще всего', () => {
  // 11-14 всегда «многие», хотя оканчиваются на 1-4
  expect(plural(11, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(12, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(14, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(111, 'модель', 'модели', 'моделей')).toBe('моделей')
  expect(plural(101, 'модель', 'модели', 'моделей')).toBe('модель')
})

test('число вместе со словом', () => {
  expect(formatCount(61, 'модель', 'модели', 'моделей')).toBe('61 модель')
  expect(formatCount(34, 'модель', 'модели', 'моделей')).toBe('34 модели')
  expect(formatCount(579, 'фаркоп', 'фаркопа', 'фаркопов')).toBe('579 фаркопов')
})

test('цена с разделением разрядов', () => {
  expect(formatPrice(15990)).toBe('15 990 ₽')
  expect(formatPrice(4090)).toBe('4 090 ₽')
  expect(formatPrice(199990)).toBe('199 990 ₽')
})

test('годы выпуска', () => {
  expect(formatYears(1995, 2000)).toBe('1995–2000')
  expect(formatYears(2025, null)).toBe('2025 и новее')
  expect(formatYears(null, null)).toBe('')
})

test('подпись кузова собирается из латинских частей', () => {
  expect(formatVariantLabel('Toyota', 'RAV4', 'XA10', 1995, 2000)).toBe(
    'Toyota RAV4 XA10 1995–2000',
  )
})

test('подпись без кода поколения не оставляет двойных пробелов', () => {
  expect(formatVariantLabel('Audi', 'A6', null, 1997, 2004)).toBe('Audi A6 1997–2004')
})

test('подпись без годов обходится названием', () => {
  expect(formatVariantLabel('Alfa Romeo', 'Giulia', null, null, null)).toBe('Alfa Romeo Giulia')
})
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `npx vitest run src/catalog/format.test.ts`
Expected: FAIL, модуль `./format` не найден.

- [ ] **Step 3: Написать реализацию**

Создать `src/catalog/format.ts`:

```typescript
/**
 * Склонение существительного при числительном по русским правилам.
 *
 * Числа на 11–14 всегда требуют формы «многих», хотя оканчиваются на 1–4:
 * «11 моделей», а не «11 модель». Это самая частая ошибка в подписях,
 * а они выводятся на 8 238 страницах.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  if (abs >= 11 && abs <= 14) return many

  const last = abs % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

/** Число вместе со словом в нужной форме: «61 модель». */
export function formatCount(n: number, one: string, few: string, many: string): string {
  return `${n} ${plural(n, one, few, many)}`
}

/** Цена с неразрывными пробелами между разрядами. */
export function formatPrice(value: number): string {
  return `${value.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')} ₽`
}

/** Диапазон лет выпуска. Пустая строка, если годов в данных нет. */
export function formatYears(from: number | null, to: number | null): string {
  if (from === null) return ''
  return to === null ? `${from} и новее` : `${from}–${to}`
}

/**
 * Подпись кузова для заголовков и хлебных крошек.
 *
 * Собирается из отдельных полей, а не из названия кузова в базе:
 * там оно кириллическое («Тойота РАВ4»), а марка и модель латинские.
 * Склейка дала бы «Toyota Тойота РАВ4».
 */
export function formatVariantLabel(
  brand: string,
  model: string,
  generation: string | null,
  from: number | null,
  to: number | null,
): string {
  return [brand, model, generation, formatYears(from, to)]
    .filter((part): part is string => part !== null && part !== '')
    .join(' ')
}
```

- [ ] **Step 4: Запустить, убедиться что проходит**

Run: `npx vitest run src/catalog/format.test.ts`
Expected: PASS, `8 passed`.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: форматирование подписей каталога"
```

---

## Task 3: Построение адресов

**Files:**
- Create: `src/catalog/urls.ts`, `src/catalog/urls.test.ts`

**Interfaces:**
- Produces:
  - `SITE_URL: string`
  - `urls.home(): string`, `urls.catalog(): string`
  - `urls.brand(brandSlug: string): string`
  - `urls.model(brandSlug: string, modelSlug: string): string`
  - `urls.variant(brandSlug: string, modelSlug: string, variantSlug: string): string`
  - `urls.product(articleSlug: string): string`
  - `absolute(path: string): string`

- [ ] **Step 1: Написать падающие тесты**

Создать `src/catalog/urls.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { absolute, SITE_URL, urls } from './urls'

test('пути каталога', () => {
  expect(urls.home()).toBe('/')
  expect(urls.catalog()).toBe('/farkopy')
  expect(urls.brand('toyota')).toBe('/farkopy/toyota')
  expect(urls.model('toyota', 'rav4')).toBe('/farkopy/toyota/rav4')
  expect(urls.variant('toyota', 'rav4', 'xa10-1995-2000')).toBe(
    '/farkopy/toyota/rav4/xa10-1995-2000',
  )
  expect(urls.product('t030a')).toBe('/tovar/t030a')
})

test('абсолютный адрес склеивается без двойного слэша', () => {
  expect(absolute('/farkopy/toyota')).toBe(`${SITE_URL}/farkopy/toyota`)
  expect(absolute('/')).toBe(`${SITE_URL}/`)
})
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `npx vitest run src/catalog/urls.test.ts`
Expected: FAIL, модуль `./urls` не найден.

- [ ] **Step 3: Написать реализацию**

Создать `src/catalog/urls.ts`:

```typescript
/**
 * Адрес сайта. Нужен для канонических ссылок, карты сайта и микроразметки —
 * там требуются абсолютные адреса.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autoprofi.spb.ru'

/**
 * Все пути каталога строятся только здесь.
 *
 * Иначе адреса расползаются по компонентам, и переименование раздела
 * превращается в поиск по строкам с риском пропустить ссылку.
 */
export const urls = {
  home: (): string => '/',
  catalog: (): string => '/farkopy',
  brand: (brandSlug: string): string => `/farkopy/${brandSlug}`,
  model: (brandSlug: string, modelSlug: string): string => `/farkopy/${brandSlug}/${modelSlug}`,
  variant: (brandSlug: string, modelSlug: string, variantSlug: string): string =>
    `/farkopy/${brandSlug}/${modelSlug}/${variantSlug}`,
  product: (articleSlug: string): string => `/tovar/${articleSlug}`,
}

/** Абсолютный адрес для канонических ссылок и разметки. */
export function absolute(path: string): string {
  return `${SITE_URL}${path}`
}
```

- [ ] **Step 4: Запустить, убедиться что проходит**

Run: `npx vitest run src/catalog/urls.test.ts`
Expected: PASS, `2 passed`.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: построение адресов каталога"
```

---

## Task 4: Слой запросов к каталогу

**Files:**
- Create: `src/catalog/queries.ts`, `src/catalog/queries.test.ts`

**Interfaces:**
- Consumes: схема из `src/db/schema.ts`, `getDb()` из `src/db/client.ts`
- Produces:

```typescript
export interface BrandRow { slug: string; name: string; productCount: number; modelCount: number }
export interface ModelRow { slug: string; name: string; productCount: number; variantCount: number }
export interface VariantRow {
  slug: string; name: string; generation: string | null
  yearFrom: number | null; yearTo: number | null
  productCount: number; hasOwnPage: boolean
}
export interface ProductRow {
  slug: string; article: string; manufacturer: string; country: string | null
  price: number; inStock: boolean; deliveryText: string | null
  ballType: string | null; towLoadKg: number | null; verticalLoadKg: number | null
  weightKg: number | null; bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null; description: string
  images: string[]; documents: { url: string; label: string }[]
}

listBrands(db): Promise<BrandRow[]>
getBrand(db, slug): Promise<BrandRow | null>
listModels(db, brandSlug): Promise<ModelRow[]>
getModel(db, brandSlug, modelSlug): Promise<ModelRow | null>
listVariants(db, brandSlug, modelSlug): Promise<VariantRow[]>
getVariant(db, brandSlug, modelSlug, variantSlug): Promise<VariantRow | null>
listProductsForVariant(db, variantSlug, brandSlug, modelSlug): Promise<ProductRow[]>
getProduct(db, articleSlug): Promise<ProductRow | null>
listVariantsForProduct(db, productSlug): Promise<{ brand: string; brandSlug: string; model: string; modelSlug: string; variant: VariantRow }[]>
listAllVariantPaths(db): Promise<{ brand: string; model: string; variant: string }[]>
listAllProductSlugs(db): Promise<string[]>
```

Все функции принимают `db: DrizzleDb` первым аргументом — так их можно тестировать на базе в памяти.

- [ ] **Step 1: Написать падающие тесты**

Создать `src/catalog/queries.test.ts`:

```typescript
import { beforeAll, expect, test } from 'vitest'
import { createTestDb } from '../db/test-helpers'
import { importCatalog } from '../import/run'
import { recalculateCounters } from '../import/counters'
import {
  getBrand,
  getModel,
  getProduct,
  getVariant,
  listAllProductSlugs,
  listAllVariantPaths,
  listBrands,
  listModels,
  listProductsForVariant,
  listVariants,
  listVariantsForProduct,
} from './queries'

const FIXTURE = `<script id="catalog-data" type="application/json">{
"brands":[["b:t","Toyota","u"],["b:c","Chery","u"]],
"models":[["m:1",0,"RAV4","u"],["m:2",1,"Tiggo","u"]],
"variants":[
  ["v:1",0,"фаркопы для Тойота РАВ4 XA10 1995-2000","u",0],
  ["v:2",0,"фаркопы для Тойота РАВ4 XA20 2000-2006","u",0],
  ["v:3",1,"фаркопы для Чери Тигго 2020-","u",0]
],
"products":[
  ["galia::t030a","T030A","GALIA","Словакия","Оцинкованный фаркоп",15990,"сегодня","3 шт Сегодня","u","A",1750,75,13.25,"not_required",false,["https://x/1.jpg"],[["https://x/1.pdf","Инструкция"]]],
  ["steinhof::t185","T-185","Steinhof","Польша","Съёмный",20990,"1-6 Мес","1 шт 1-6 Мес","u","F",1750,75,18,"required","unknown",[],[]]
],
"fitments":[
  [0,0,0,0,15990,"сегодня","u","u",1],
  [0,0,1,0,15990,"сегодня","u","u",1],
  [0,0,0,1,20990,"1-6 Мес","u","u",1]
]}</script>`

let db: Awaited<ReturnType<typeof createTestDb>>

beforeAll(async () => {
  db = await createTestDb()
  await importCatalog(FIXTURE, db)
  await recalculateCounters(db)
})

test('список марок содержит только публикуемые', async () => {
  const brands = await listBrands(db)
  expect(brands.map((b) => b.slug)).toEqual(['toyota'])
})

test('марка отдаёт счётчики', async () => {
  const brand = await getBrand(db, 'toyota')
  expect(brand?.name).toBe('Toyota')
  expect(brand?.productCount).toBe(2)
})

test('несуществующая марка даёт null', async () => {
  expect(await getBrand(db, 'nissan')).toBeNull()
})

test('скрытая марка не отдаётся', async () => {
  expect(await getBrand(db, 'chery')).toBeNull()
})

test('модели марки', async () => {
  const models = await listModels(db, 'toyota')
  expect(models.map((m) => m.slug)).toEqual(['rav4'])
  expect(models[0].variantCount).toBe(2)
})

test('кузова модели с разобранными годами', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  expect(variants).toHaveLength(2)
  const xa10 = variants.find((v) => v.generation === 'XA10')
  expect(xa10?.yearFrom).toBe(1995)
  expect(xa10?.yearTo).toBe(2000)
  expect(xa10?.hasOwnPage).toBe(true)
})

test('кузов по слагу', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  const variant = await getVariant(db, 'toyota', 'rav4', variants[0].slug)
  expect(variant?.slug).toBe(variants[0].slug)
})

test('товары кузова отсортированы по цене', async () => {
  const variants = await listVariants(db, 'toyota', 'rav4')
  const xa10 = variants.find((v) => v.generation === 'XA10')!
  const products = await listProductsForVariant(db, xa10.slug, 'toyota', 'rav4')
  expect(products.map((p) => p.article)).toEqual(['T030A', 'T-185'])
})

test('товар отдаёт характеристики и документы', async () => {
  const product = await getProduct(db, 't030a')
  expect(product?.manufacturer).toBe('GALIA')
  expect(product?.country).toBe('Словакия')
  expect(product?.ballType).toBe('A')
  expect(product?.inStock).toBe(true)
  expect(product?.documents).toEqual([{ url: 'https://x/1.pdf', label: 'Инструкция' }])
})

test('неизвестная электрика отдаётся как null', async () => {
  const product = await getProduct(db, 't-185')
  expect(product?.electricsIncluded).toBeNull()
})

test('машины, к которым подходит товар', async () => {
  const fits = await listVariantsForProduct(db, 't030a')
  expect(fits).toHaveLength(2)
  expect(fits[0].brand).toBe('Toyota')
  expect(fits[0].model).toBe('RAV4')
})

test('пути всех кузовов со своими страницами', async () => {
  const paths = await listAllVariantPaths(db)
  expect(paths).toHaveLength(2)
  expect(paths[0].brand).toBe('toyota')
})

test('слаги всех товаров', async () => {
  const slugs = await listAllProductSlugs(db)
  expect(slugs.sort()).toEqual(['t-185', 't030a'])
})
```

- [ ] **Step 2: Запустить, убедиться что падает**

Run: `npx vitest run src/catalog/queries.test.ts`
Expected: FAIL, модуль `./queries` не найден.

- [ ] **Step 3: Написать реализацию**

Создать `src/catalog/queries.ts`:

```typescript
import { and, asc, eq } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'

export interface BrandRow {
  slug: string
  name: string
  productCount: number
  modelCount: number
}

export interface ModelRow {
  slug: string
  name: string
  productCount: number
  variantCount: number
}

export interface VariantRow {
  slug: string
  name: string
  generation: string | null
  yearFrom: number | null
  yearTo: number | null
  productCount: number
  hasOwnPage: boolean
}

export interface ProductRow {
  slug: string
  article: string
  manufacturer: string
  country: string | null
  price: number
  inStock: boolean
  deliveryText: string | null
  ballType: string | null
  towLoadKg: number | null
  verticalLoadKg: number | null
  weightKg: number | null
  bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null
  description: string
  images: string[]
  documents: { url: string; label: string }[]
}

/** Марки с товарами, по алфавиту. Пустые не публикуются. */
export async function listBrands(db: DrizzleDb): Promise<BrandRow[]> {
  return db
    .select({
      slug: brands.slug,
      name: brands.name,
      productCount: brands.productCount,
      modelCount: brands.modelCount,
    })
    .from(brands)
    .where(eq(brands.isPublished, true))
    .orderBy(asc(brands.name))
}

export async function getBrand(db: DrizzleDb, slug: string): Promise<BrandRow | null> {
  const [row] = await db
    .select({
      slug: brands.slug,
      name: brands.name,
      productCount: brands.productCount,
      modelCount: brands.modelCount,
    })
    .from(brands)
    .where(and(eq(brands.slug, slug), eq(brands.isPublished, true)))
    .limit(1)
  return row ?? null
}

export async function listModels(db: DrizzleDb, brandSlug: string): Promise<ModelRow[]> {
  return db
    .select({
      slug: models.slug,
      name: models.name,
      productCount: models.productCount,
      variantCount: models.variantCount,
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(brands.slug, brandSlug), eq(models.isPublished, true)))
    .orderBy(asc(models.name))
}

export async function getModel(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
): Promise<ModelRow | null> {
  const [row] = await db
    .select({
      slug: models.slug,
      name: models.name,
      productCount: models.productCount,
      variantCount: models.variantCount,
    })
    .from(models)
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        eq(models.slug, modelSlug),
        eq(models.isPublished, true),
      ),
    )
    .limit(1)
  return row ?? null
}

export async function listVariants(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
): Promise<VariantRow[]> {
  return db
    .select({
      slug: variants.slug,
      name: variants.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      productCount: variants.productCount,
      hasOwnPage: variants.hasOwnPage,
    })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        eq(models.slug, modelSlug),
        eq(variants.isPublished, true),
      ),
    )
    .orderBy(asc(variants.yearFrom))
}

export async function getVariant(
  db: DrizzleDb,
  brandSlug: string,
  modelSlug: string,
  variantSlug: string,
): Promise<VariantRow | null> {
  const all = await listVariants(db, brandSlug, modelSlug)
  return all.find((v) => v.slug === variantSlug) ?? null
}

/** Товары, подходящие к кузову. Дешёвые первыми — так их и сравнивают. */
export async function listProductsForVariant(
  db: DrizzleDb,
  variantSlug: string,
  brandSlug: string,
  modelSlug: string,
): Promise<ProductRow[]> {
  return db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      country: manufacturers.country,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      weightKg: products.weightKg,
      bumperCut: products.bumperCut,
      electricsIncluded: products.electricsIncluded,
      description: products.description,
      images: products.images,
      documents: products.documents,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .innerJoin(fitments, eq(fitments.productId, products.id))
    .innerJoin(variants, eq(variants.id, fitments.variantId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(
      and(
        eq(brands.slug, brandSlug),
        eq(models.slug, modelSlug),
        eq(variants.slug, variantSlug),
      ),
    )
    .orderBy(asc(products.sourcePrice))
}

export async function getProduct(db: DrizzleDb, articleSlug: string): Promise<ProductRow | null> {
  const [row] = await db
    .select({
      slug: products.slug,
      article: products.article,
      manufacturer: manufacturers.name,
      country: manufacturers.country,
      price: products.sourcePrice,
      inStock: products.inStock,
      deliveryText: products.deliveryText,
      ballType: products.ballType,
      towLoadKg: products.towLoadKg,
      verticalLoadKg: products.verticalLoadKg,
      weightKg: products.weightKg,
      bumperCut: products.bumperCut,
      electricsIncluded: products.electricsIncluded,
      description: products.description,
      images: products.images,
      documents: products.documents,
    })
    .from(products)
    .innerJoin(manufacturers, eq(manufacturers.id, products.manufacturerId))
    .where(eq(products.slug, articleSlug))
    .limit(1)
  return row ?? null
}

/** Машины, к которым подходит товар. Ключевой узел перелинковки. */
export async function listVariantsForProduct(
  db: DrizzleDb,
  articleSlug: string,
): Promise<
  { brand: string; brandSlug: string; model: string; modelSlug: string; variant: VariantRow }[]
> {
  const rows = await db
    .select({
      brand: brands.name,
      brandSlug: brands.slug,
      model: models.name,
      modelSlug: models.slug,
      slug: variants.slug,
      name: variants.name,
      generation: variants.generation,
      yearFrom: variants.yearFrom,
      yearTo: variants.yearTo,
      productCount: variants.productCount,
      hasOwnPage: variants.hasOwnPage,
    })
    .from(variants)
    .innerJoin(fitments, eq(fitments.variantId, variants.id))
    .innerJoin(products, eq(products.id, fitments.productId))
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(and(eq(products.slug, articleSlug), eq(variants.isPublished, true)))
    .orderBy(asc(brands.name), asc(models.name), asc(variants.yearFrom))

  return rows.map((r) => ({
    brand: r.brand,
    brandSlug: r.brandSlug,
    model: r.model,
    modelSlug: r.modelSlug,
    variant: {
      slug: r.slug,
      name: r.name,
      generation: r.generation,
      yearFrom: r.yearFrom,
      yearTo: r.yearTo,
      productCount: r.productCount,
      hasOwnPage: r.hasOwnPage,
    },
  }))
}

/** Пути всех кузовов со своей страницей — для generateStaticParams. */
export async function listAllVariantPaths(
  db: DrizzleDb,
): Promise<{ brand: string; model: string; variant: string }[]> {
  return db
    .select({ brand: brands.slug, model: models.slug, variant: variants.slug })
    .from(variants)
    .innerJoin(models, eq(models.id, variants.modelId))
    .innerJoin(brands, eq(brands.id, models.brandId))
    .where(eq(variants.hasOwnPage, true))
}

export async function listAllProductSlugs(db: DrizzleDb): Promise<string[]> {
  const rows = await db.select({ slug: products.slug }).from(products)
  return rows.map((r) => r.slug)
}
```

- [ ] **Step 4: Запустить, убедиться что проходит**

Run: `npx vitest run src/catalog/queries.test.ts`
Expected: PASS, `13 passed`.

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: слой запросов к каталогу"
```

---

## Task 5: Шапка, подвал, хлебные крошки

**Files:**
- Create: `src/components/site-header.tsx`, `src/components/site-footer.tsx`, `src/components/breadcrumbs.tsx`
- Modify: `src/app/layout.tsx`

**Interfaces:**
- Consumes: `urls` из `src/catalog/urls.ts`, `absolute` оттуда же
- Produces:
  - `<SiteHeader />`
  - `<SiteFooter />`
  - `<Breadcrumbs items={{ label: string; href?: string }[]} />` — рисует крошки и выводит разметку `BreadcrumbList`

- [ ] **Step 1: Написать шапку**

Создать `src/components/site-header.tsx`:

```tsx
import Link from 'next/link'
import { urls } from '@/catalog/urls'

const PHONE = '+7 (812) 123-45-67'
const PHONE_HREF = 'tel:+78121234567'
const HOURS = 'Пн–Сб 9:00–19:00'

const NAV = [
  { label: 'Каталог', href: urls.catalog() },
  { label: 'Подбор по авто', href: urls.catalog() },
  { label: 'Установка', href: '/ustanovka-farkopa' },
  { label: 'Услуги', href: '/uslugi' },
  { label: 'Акции', href: '/akcii' },
  { label: 'Контакты', href: '/kontakty' },
]

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-4">
        <Link
          href={urls.home()}
          className="font-[family-name:var(--font-display)] text-sm tracking-[0.22em] text-ink"
        >
          AUTOPROFI
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-ink-muted lg:flex">
          {NAV.map((item) => (
            <Link key={item.label} href={item.href} className="hover:text-ink">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto text-right">
          <a href={PHONE_HREF} className="block text-base font-bold text-ink">
            {PHONE}
          </a>
          <span className="text-xs text-ink-muted">{HOURS}</span>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Написать подвал**

Создать `src/components/site-footer.tsx`:

```tsx
import Link from 'next/link'
import { urls } from '@/catalog/urls'

const POPULAR = [
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Nissan', slug: 'nissan' },
]

const SERVICES = [
  { label: 'Установка фаркопа', href: '/ustanovka-farkopa' },
  { label: 'Электрика и розетка', href: '/uslugi/elektrika' },
  { label: 'Подбор и консультация', href: '/uslugi/podbor' },
  { label: 'Сварка и ремонт ТСУ', href: '/uslugi/remont-tsu' },
]

const COMPANY = [
  { label: 'О нас', href: '/o-nas' },
  { label: 'Наши работы', href: '/nashi-raboty' },
  { label: 'Отзывы', href: '/otzyvy' },
  { label: 'Акции', href: '/akcii' },
  { label: 'Блог', href: '/blog' },
  { label: 'Доставка', href: '/dostavka' },
  { label: 'Гарантия', href: '/garantiya' },
  { label: 'Контакты', href: '/kontakty' },
]

const LEGAL = [
  { label: 'Политика конфиденциальности', href: '/politika-konfidencialnosti' },
  { label: 'Согласие на обработку персональных данных', href: '/soglasie-na-obrabotku' },
  { label: 'Пользовательское соглашение', href: '/polzovatelskoe-soglashenie' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="mx-auto max-w-[1400px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-[family-name:var(--font-display)] text-sm tracking-[0.22em] text-ink">
              AUTOPROFI
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Фаркопы с установкой в Петербурге и доставкой по России
            </p>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Каталог</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {POPULAR.map((b) => (
                <li key={b.slug}>
                  <Link href={urls.brand(b.slug)} className="hover:text-ink">
                    {b.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={urls.catalog()} className="text-accent hover:text-accent-hover">
                  Все 106 марок
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Услуги</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="hover:text-ink">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Компания</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-line pt-8">
          <a href="tel:+78121234567" className="text-2xl font-bold text-ink">
            +7 (812) 123-45-67
          </a>
          <span className="text-sm text-ink-muted">Пн–Сб 9:00–19:00</span>
          <span className="text-sm text-ink-muted">Санкт-Петербург, Софийская ул. 72</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-ink-dim">
          <span>© 2026 AUTOPROFI · ИНН 0000000000 · ОГРН 0000000000000</span>
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-muted">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 3: Написать хлебные крошки с разметкой**

Создать `src/components/breadcrumbs.tsx`:

```tsx
import Link from 'next/link'
import { absolute } from '@/catalog/urls'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Хлебные крошки вместе с разметкой BreadcrumbList.
 *
 * Разметка обязательна: Яндекс выводит крошки прямо в сниппете,
 * это заметно поднимает кликабельность. Последний элемент — текущая
 * страница, у неё ссылки нет.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 && <span className="text-ink-dim">→</span>}
            {item.href ? (
              <Link href={item.href} className="text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
```

- [ ] **Step 4: Подключить шапку и подвал в layout**

В `src/app/layout.tsx` заменить тело:

```tsx
      <body className="min-h-full flex flex-col bg-bg text-ink font-[family-name:var(--font-body)]">
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
```

И добавить импорты вверху файла:

```tsx
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
```

- [ ] **Step 5: Проверить сборку**

Run: `npm run build`
Expected: `Compiled successfully`.

- [ ] **Step 6: Коммит**

```bash
git add -A
git commit -m "feat: шапка, подвал и хлебные крошки"
```

---

## Task 6: Карточка товара в списке

**Files:**
- Create: `src/components/product-card.tsx`

**Interfaces:**
- Consumes: `ProductRow` из `src/catalog/queries.ts`, `formatPrice` из `src/catalog/format.ts`, `urls`
- Produces: `<ProductCard product={ProductRow} />`

- [ ] **Step 1: Написать компонент**

Создать `src/components/product-card.tsx`:

```tsx
import Link from 'next/link'
import { formatPrice } from '@/catalog/format'
import type { ProductRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

const BUMPER_LABEL: Record<ProductRow['bumperCut'], string | null> = {
  not_required: 'без выреза бампера',
  required: 'нужен вырез бампера',
  unknown: null,
}

/**
 * Карточка товара в списке.
 *
 * Бейдж наличия сделан заметным намеренно: в каталоге соседствуют товары
 * с отгрузкой сегодня и позиции под заказ на 1–6 месяцев. Если человек
 * не увидит разницу при заказе, он узнает о ней через полгода ожидания.
 */
export function ProductCard({ product }: { product: ProductRow }) {
  const chips = [
    product.ballType ? `Шар ${product.ballType}` : null,
    product.towLoadKg && product.verticalLoadKg
      ? `${product.towLoadKg}/${product.verticalLoadKg} кг`
      : null,
    product.weightKg ? `${product.weightKg} кг` : null,
    BUMPER_LABEL[product.bumperCut],
  ].filter((chip): chip is string => chip !== null)

  return (
    <article className="flex gap-5 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <div className="hidden h-36 w-36 shrink-0 items-center justify-center rounded-lg bg-surface-2 sm:flex">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={`Фаркоп ${product.article}`}
            className="h-full w-full rounded-lg object-contain"
            loading="lazy"
          />
        ) : (
          <span className="text-xs text-ink-dim">нет фото</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-[family-name:var(--font-display)] text-lg text-ink">
          {product.article}
        </div>
        <div className="mt-1 text-sm text-ink-muted">
          {product.manufacturer}
          {product.country ? ` · ${product.country}` : ''}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="text-xl font-bold text-accent">{formatPrice(product.price)}</span>
          <span
            className={`rounded px-2 py-1 text-xs font-semibold ${
              product.inStock
                ? 'bg-in-stock/15 text-in-stock'
                : 'bg-on-order/15 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded border border-line px-2 py-1 text-xs text-ink-muted"
            >
              {chip}
            </span>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white"
          >
            Узнать цену
          </button>
          <Link
            href={urls.product(product.slug)}
            className="rounded-lg border border-line px-4 py-2 text-sm text-ink"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Проверить типы**

Run: `npx tsc --noEmit`
Expected: без ошибок.

- [ ] **Step 3: Коммит**

```bash
git add -A
git commit -m "feat: карточка товара в списке"
```

---

## Task 7: Страница кузова

**Files:**
- Create: `src/app/farkopy/[brand]/[model]/[variant]/page.tsx`

**Interfaces:**
- Consumes: всё из Task 2–6
- Produces: 1 368 статических страниц

- [ ] **Step 1: Написать страницу**

Создать `src/app/farkopy/[brand]/[model]/[variant]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { formatCount, formatPrice, formatVariantLabel } from '@/catalog/format'
import {
  getBrand,
  getModel,
  getVariant,
  listAllVariantPaths,
  listProductsForVariant,
  listVariants,
} from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ brand: string; model: string; variant: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  return listAllVariantPaths(db)
}

async function load(brandSlug: string, modelSlug: string, variantSlug: string) {
  const db = await getDb()
  const [brand, model, variant] = await Promise.all([
    getBrand(db, brandSlug),
    getModel(db, brandSlug, modelSlug),
    getVariant(db, brandSlug, modelSlug, variantSlug),
  ])
  if (!brand || !model || !variant) return null

  const [products, siblings] = await Promise.all([
    listProductsForVariant(db, variantSlug, brandSlug, modelSlug),
    listVariants(db, brandSlug, modelSlug),
  ])
  return { brand, model, variant, products, siblings }
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand, model, variant } = await params
  const data = await load(brand, model, variant)
  if (!data) return {}

  const label = formatVariantLabel(
    data.brand.name,
    data.model.name,
    data.variant.generation,
    data.variant.yearFrom,
    data.variant.yearTo,
  )
  const cheapest = data.products[0]

  return {
    title: `Фаркопы на ${label} — купить с установкой`,
    description: `${formatCount(data.products.length, 'фаркоп', 'фаркопа', 'фаркопов')} на ${label}${
      cheapest ? `, цены от ${formatPrice(cheapest.price)}` : ''
    }. Установка за один визит, доставка по России.`,
    alternates: { canonical: absolute(urls.variant(brand, model, variant)) },
  }
}

export default async function VariantPage({ params }: Params) {
  const { brand, model, variant } = await params
  const data = await load(brand, model, variant)
  if (!data) notFound()

  const label = formatVariantLabel(
    data.brand.name,
    data.model.name,
    data.variant.generation,
    data.variant.yearFrom,
    data.variant.yearTo,
  )
  const cheapest = data.products[0]
  const others = data.siblings.filter((v) => v.slug !== variant && v.hasOwnPage)

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          { label: data.brand.name, href: urls.brand(brand) },
          { label: data.model.name, href: urls.model(brand, model) },
          { label: data.variant.name },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы на {label}
      </h1>
      <p className="mt-3 text-ink-muted">
        {formatCount(data.products.length, 'фаркоп', 'фаркопа', 'фаркопов')}
        {cheapest ? ` · цены от ${formatPrice(cheapest.price)}` : ''} · установка за 3 часа
      </p>

      <div className="mt-8 space-y-4">
        {data.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-block)] border border-line bg-surface p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
            Установка в Санкт-Петербурге
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            3 часа работы, гарантия 2 года, документы для ТО. Софийская ул. 72.
          </p>
          <Link href="/ustanovka-farkopa" className="mt-4 inline-block text-accent">
            Цены на установку →
          </Link>
        </div>
        <div className="rounded-[var(--radius-block)] border border-line bg-surface p-6">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
            Доставка по России
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            СДЭК в 1 100 городов, до двери или в пункт выдачи, с отслеживанием.
          </p>
          <Link href="/dostavka" className="mt-4 inline-block text-accent">
            Рассчитать доставку →
          </Link>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-ink">
            Другие поколения {data.model.name}
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {others.map((sibling) => (
              <Link
                key={sibling.slug}
                href={urls.variant(brand, model, sibling.slug)}
                className="rounded-lg border border-line px-4 py-3 text-sm text-ink-muted hover:text-ink"
              >
                <span className="block text-ink">
                  {sibling.generation ?? data.model.name}
                </span>
                <span className="text-xs">
                  {formatCount(sibling.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
```

- [ ] **Step 2: Собрать и проверить количество страниц**

Run: `npm run build`
Expected: в выводе маршрут `/farkopy/[brand]/[model]/[variant]` с числом сгенерированных страниц **1368**.

- [ ] **Step 3: Проверить конкретную страницу**

Run: `cat ".next/server/app/farkopy/toyota/rav4/tojota-rav4-xa10-1995-2000.html" | head -40`

Если имя файла отличается, найти его: `ls .next/server/app/farkopy/toyota/rav4/`
Expected: HTML содержит `<h1>` с текстом «Фаркопы на Toyota RAV4 XA10 1995–2000» и разметку `BreadcrumbList`.

- [ ] **Step 4: Коммит**

```bash
git add -A
git commit -m "feat: страница кузова"
```

---

## Task 8: Карточка товара, страницы марки и модели

**Files:**
- Create: `src/app/tovar/[article]/page.tsx`, `src/app/farkopy/[brand]/page.tsx`, `src/app/farkopy/[brand]/[model]/page.tsx`

**Interfaces:**
- Consumes: всё из Task 2–6
- Produces: 5 808 + 106 + 956 страниц

- [ ] **Step 1: Написать карточку товара**

Создать `src/app/tovar/[article]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { formatPrice, formatVariantLabel } from '@/catalog/format'
import { getProduct, listAllProductSlugs, listVariantsForProduct } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ article: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const slugs = await listAllProductSlugs(db)
  return slugs.map((article) => ({ article }))
}

const BUMPER_TEXT = {
  not_required: 'не требуется',
  required: 'требуется',
  unknown: 'нет данных',
} as const

async function load(articleSlug: string) {
  const db = await getDb()
  const product = await getProduct(db, articleSlug)
  if (!product) return null
  const fits = await listVariantsForProduct(db, articleSlug)
  return { product, fits }
}

/**
 * Заголовок бывает двух видов.
 *
 * Если фаркоп подходит ровно к одной машине — она входит в заголовок,
 * и страница ловит запросы вида «фаркоп на рав4 xa10 galia». Таких
 * товаров 61%. Если машин несколько, заголовок обезличенный, иначе
 * страница врала бы про совместимость.
 */
function buildTitle(
  article: string,
  manufacturer: string,
  fits: Awaited<ReturnType<typeof listVariantsForProduct>>,
): string {
  if (fits.length !== 1) return `Фаркоп ${manufacturer} ${article}`
  const only = fits[0]
  const label = formatVariantLabel(
    only.brand,
    only.model,
    only.variant.generation,
    only.variant.yearFrom,
    only.variant.yearTo,
  )
  return `Фаркоп ${manufacturer} ${article} на ${label}`
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { article } = await params
  const data = await load(article)
  if (!data) return {}

  const title = buildTitle(data.product.article, data.product.manufacturer, data.fits)
  return {
    title: `${title} — купить с установкой`,
    description: data.product.description.slice(0, 300),
    alternates: { canonical: absolute(urls.product(article)) },
  }
}

export default async function ProductPage({ params }: Params) {
  const { article } = await params
  const data = await load(article)
  if (!data) notFound()

  const { product, fits } = data
  const title = buildTitle(product.article, product.manufacturer, fits)
  const first = fits[0]

  const specs: [string, string][] = [
    ['Тип шара', product.ballType ?? 'нет данных'],
    ['Тяговая нагрузка', product.towLoadKg ? `${product.towLoadKg} кг` : 'нет данных'],
    ['Вертикальная нагрузка', product.verticalLoadKg ? `${product.verticalLoadKg} кг` : 'нет данных'],
    ['Масса фаркопа', product.weightKg ? `${product.weightKg} кг` : 'нет данных'],
    ['Вырез бампера', BUMPER_TEXT[product.bumperCut]],
    [
      'Электрика в комплекте',
      product.electricsIncluded === null ? 'нет данных' : product.electricsIncluded ? 'да' : 'нет',
    ],
    ['Страна производства', product.country ?? 'нет данных'],
  ]

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          ...(first
            ? [
                { label: first.brand, href: urls.brand(first.brandSlug) },
                { label: first.model, href: urls.model(first.brandSlug, first.modelSlug) },
              ]
            : []),
          { label: product.article },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">{title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] bg-surface-2">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={`Фаркоп ${product.article}`}
                className="h-full w-full rounded-[var(--radius-card)] object-contain"
              />
            ) : (
              <span className="text-ink-dim">нет фото</span>
            )}
          </div>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
            Характеристики
          </h2>
          <dl className="mt-4">
            {specs.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-line py-3 text-sm">
                <dt className="text-ink-muted">{key}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">Описание</h2>
          <p className="mt-3 text-ink-muted">{product.description}</p>

          {product.documents.length > 0 && (
            <>
              <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
                Документы
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.documents.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line p-4 text-sm text-ink"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-white">
                      PDF
                    </span>
                    {doc.label}
                  </a>
                ))}
              </div>
            </>
          )}

          {fits.length > 0 && (
            <>
              <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
                Подходит к автомобилям
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {fits.map((fit) => (
                  <Link
                    key={`${fit.brandSlug}-${fit.modelSlug}-${fit.variant.slug}`}
                    href={
                      fit.variant.hasOwnPage
                        ? urls.variant(fit.brandSlug, fit.modelSlug, fit.variant.slug)
                        : urls.model(fit.brandSlug, fit.modelSlug)
                    }
                    className="rounded-[var(--radius-card)] border border-line p-4 text-sm"
                  >
                    <span className="block text-ink">
                      {fit.brand} {fit.model}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {formatVariantLabel(
                        '',
                        '',
                        fit.variant.generation,
                        fit.variant.yearFrom,
                        fit.variant.yearTo,
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-[var(--radius-block)] border border-line bg-surface p-6 lg:sticky lg:top-6">
          <div className="text-sm text-ink-muted">
            {product.manufacturer}
            {product.country ? ` · ${product.country}` : ''} · артикул {product.article}
          </div>
          <div className="mt-3 text-3xl font-bold text-accent">{formatPrice(product.price)}</div>
          <div
            className={`mt-3 inline-block rounded px-2 py-1 text-xs font-semibold ${
              product.inStock ? 'bg-in-stock/15 text-in-stock' : 'bg-on-order/15 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white"
          >
            Узнать цену
          </button>
          <Link
            href="/ustanovka-farkopa"
            className="mt-3 block w-full rounded-lg border border-line px-4 py-3 text-center text-ink"
          >
            Записаться на установку
          </Link>
          <a href="tel:+78121234567" className="mt-6 block text-xl font-bold text-ink">
            +7 (812) 123-45-67
          </a>
          <p className="mt-2 text-xs text-ink-dim">Гарантия 2 года · документы для ТО</p>
        </aside>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Написать страницу марки**

Создать `src/app/farkopy/[brand]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { formatCount } from '@/catalog/format'
import { getBrand, listBrands, listModels } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ brand: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const brands = await listBrands(db)
  return brands.map((b) => ({ brand: b.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand } = await params
  const db = await getDb()
  const found = await getBrand(db, brand)
  if (!found) return {}

  return {
    title: `Фаркопы на ${found.name} — купить с установкой`,
    description: `${formatCount(found.productCount, 'фаркоп', 'фаркопа', 'фаркопов')} на ${found.name} для ${formatCount(found.modelCount, 'модели', 'моделей', 'моделей')}. Подбор по кузову и году выпуска.`,
    alternates: { canonical: absolute(urls.brand(brand)) },
  }
}

export default async function BrandPage({ params }: Params) {
  const { brand } = await params
  const db = await getDb()
  const found = await getBrand(db, brand)
  if (!found) notFound()

  const models = await listModels(db, brand)

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          { label: found.name },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы на {found.name}
      </h1>
      <p className="mt-3 text-ink-muted">
        {formatCount(models.length, 'модель', 'модели', 'моделей')} ·{' '}
        {formatCount(found.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
      </p>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {models.map((model) => (
          <Link
            key={model.slug}
            href={urls.model(brand, model.slug)}
            className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-accent"
          >
            <span className="block text-ink">{model.name}</span>
            <span className="text-xs text-ink-muted">
              {formatCount(model.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Написать страницу модели**

Создать `src/app/farkopy/[brand]/[model]/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
import { formatCount, formatVariantLabel, formatYears } from '@/catalog/format'
import {
  getBrand,
  getModel,
  listBrands,
  listModels,
  listProductsForVariant,
  listVariants,
} from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ brand: string; model: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const brands = await listBrands(db)
  const params: { brand: string; model: string }[] = []
  for (const brand of brands) {
    const models = await listModels(db, brand.slug)
    for (const model of models) {
      params.push({ brand: brand.slug, model: model.slug })
    }
  }
  return params
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { brand, model } = await params
  const db = await getDb()
  const [foundBrand, foundModel] = await Promise.all([
    getBrand(db, brand),
    getModel(db, brand, model),
  ])
  if (!foundBrand || !foundModel) return {}

  return {
    title: `Фаркопы на ${foundBrand.name} ${foundModel.name} — купить с установкой`,
    description: `${formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')} на ${foundBrand.name} ${foundModel.name}. Подбор по поколению и году выпуска.`,
    alternates: { canonical: absolute(urls.model(brand, model)) },
  }
}

export default async function ModelPage({ params }: Params) {
  const { brand, model } = await params
  const db = await getDb()
  const [foundBrand, foundModel] = await Promise.all([
    getBrand(db, brand),
    getModel(db, brand, model),
  ])
  if (!foundBrand || !foundModel) notFound()

  const variants = await listVariants(db, brand, model)

  /**
   * Если у модели единственный кузов, отдельной страницы у него нет —
   * она дублировала бы эту. Поэтому товары показываем прямо здесь.
   */
  const single = variants.length === 1 && !variants[0].hasOwnPage
  const products = single ? await listProductsForVariant(db, variants[0].slug, brand, model) : []

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          { label: foundBrand.name, href: urls.brand(brand) },
          { label: foundModel.name },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы на {foundBrand.name} {foundModel.name}
      </h1>
      <p className="mt-3 text-ink-muted">
        {single
          ? formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')
          : `${formatCount(variants.length, 'поколение', 'поколения', 'поколений')} · ${formatCount(foundModel.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}`}
      </p>

      {single ? (
        <div className="mt-8 space-y-4">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {variants.map((variant) => (
            <Link
              key={variant.slug}
              href={urls.variant(brand, model, variant.slug)}
              className="rounded-[var(--radius-card)] border border-line bg-surface p-5 hover:border-accent"
            >
              <span className="block text-lg text-ink">
                {variant.generation ?? foundModel.name}
              </span>
              <span className="block text-sm text-ink-muted">
                {formatYears(variant.yearFrom, variant.yearTo)}
              </span>
              <span className="mt-2 block text-xs text-ink-dim">
                {formatCount(variant.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
              </span>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 4: Собрать и проверить числа**

Run: `npm run build`
Expected в выводе:
- `/farkopy/[brand]` — **106** страниц
- `/farkopy/[brand]/[model]` — **956** страниц
- `/tovar/[article]` — **5808** страниц

- [ ] **Step 5: Коммит**

```bash
git add -A
git commit -m "feat: карточка товара, страницы марки и модели"
```

---

## Task 9: Каталог, главная, карта сайта

**Files:**
- Create: `src/app/farkopy/page.tsx`, `src/app/sitemap.ts`, `src/app/robots.ts`, `scripts/check-build.ts`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: всё предыдущее
- Produces: `/farkopy`, `/`, `/sitemap.xml`, `/robots.txt`, команда `npm run check`

- [ ] **Step 1: Написать страницу каталога**

Создать `src/app/farkopy/page.tsx`:

```tsx
import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { formatCount } from '@/catalog/format'
import { listBrands } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

export const metadata: Metadata = {
  title: 'Каталог фаркопов по маркам автомобилей',
  description:
    'Фаркопы для 106 марок автомобилей. Подбор по марке, модели и году выпуска, установка и доставка по России.',
  alternates: { canonical: absolute(urls.catalog()) },
}

export default async function CatalogPage() {
  const db = await getDb()
  const brands = await listBrands(db)
  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0)

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs items={[{ label: 'Главная', href: urls.home() }, { label: 'Фаркопы' }]} />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Фаркопы по маркам автомобилей
      </h1>
      <p className="mt-3 text-ink-muted">
        {formatCount(totalProducts, 'фаркоп', 'фаркопа', 'фаркопов')} ·{' '}
        {formatCount(brands.length, 'марка', 'марки', 'марок')}
      </p>

      <div className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
        {brands.map((brand) => (
          <Link
            key={brand.slug}
            href={urls.brand(brand.slug)}
            className="bg-surface p-5 text-center hover:bg-surface-2"
          >
            <span className="block text-ink">{brand.name}</span>
            <span className="text-xs text-ink-muted">
              {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
            </span>
          </Link>
        ))}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Написать главную**

Заменить `src/app/page.tsx`:

```tsx
import Link from 'next/link'
import { formatCount } from '@/catalog/format'
import { listBrands } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

export default async function HomePage() {
  const db = await getDb()
  const brands = await listBrands(db)
  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0)
  const popular = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 24)

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-12">
      <section>
        <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">
          Подбор · Установка · Электрика
        </p>
        <h1 className="mt-4 max-w-[16ch] font-[family-name:var(--font-display)] text-5xl leading-tight text-ink">
          Фаркопы с установкой в Санкт-Петербурге
        </h1>
        <p className="mt-5 max-w-[50ch] text-lg text-ink-muted">
          Подберём по марке, модели и году. Поставим за один визит — с документами для ТО.
        </p>

        <div className="mt-10 flex flex-wrap gap-10">
          <div>
            <div className="font-[family-name:var(--font-display)] text-4xl text-ink">
              {totalProducts.toLocaleString('ru-RU').replace(/\u00A0/g, ' ')}
            </div>
            <div className="text-sm text-ink-muted">фаркопов в наличии</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-4xl text-ink">2 года</div>
            <div className="text-sm text-ink-muted">гарантии на работы</div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-4xl text-ink">3 часа</div>
            <div className="text-sm text-ink-muted">средняя установка</div>
          </div>
        </div>
      </section>

      <section className="mt-20">
        <h2 className="font-[family-name:var(--font-display)] text-3xl text-ink">
          {formatCount(brands.length, 'марка', 'марки', 'марок')}
        </h2>
        <p className="mt-3 text-ink-muted">Найдём под любую</p>

        <div className="mt-8 grid gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
          {popular.map((brand) => (
            <Link
              key={brand.slug}
              href={urls.brand(brand.slug)}
              className="bg-surface p-5 text-center hover:bg-surface-2"
            >
              <span className="block text-ink">{brand.name}</span>
              <span className="text-xs text-ink-muted">
                {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
              </span>
            </Link>
          ))}
        </div>

        <Link href={urls.catalog()} className="mt-6 inline-block text-accent">
          Весь каталог → <span className="text-ink-dim">ещё {brands.length - 24} марки</span>
        </Link>
      </section>
    </main>
  )
}
```

- [ ] **Step 3: Написать карту сайта**

Создать `src/app/sitemap.ts`:

```typescript
import type { MetadataRoute } from 'next'
import { listAllProductSlugs, listAllVariantPaths, listBrands, listModels } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { getDb } from '@/db/client'

/**
 * Карта сайта строится из базы, а не пишется руками.
 *
 * Страниц больше восьми тысяч, и любая ручная поддержка разойдётся
 * с реальностью на первом же обновлении каталога.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = await getDb()
  const brands = await listBrands(db)

  const entries: MetadataRoute.Sitemap = [
    { url: absolute(urls.home()), priority: 1 },
    { url: absolute(urls.catalog()), priority: 0.9 },
  ]

  for (const brand of brands) {
    entries.push({ url: absolute(urls.brand(brand.slug)), priority: 0.8 })
    const models = await listModels(db, brand.slug)
    for (const model of models) {
      entries.push({ url: absolute(urls.model(brand.slug, model.slug)), priority: 0.7 })
    }
  }

  for (const path of await listAllVariantPaths(db)) {
    entries.push({
      url: absolute(urls.variant(path.brand, path.model, path.variant)),
      priority: 0.9,
    })
  }

  for (const slug of await listAllProductSlugs(db)) {
    entries.push({ url: absolute(urls.product(slug)), priority: 0.6 })
  }

  return entries
}
```

- [ ] **Step 4: Написать robots.txt**

Создать `src/app/robots.ts`:

```typescript
import type { MetadataRoute } from 'next'
import { absolute } from '@/catalog/urls'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  }
}
```

- [ ] **Step 5: Написать проверку сборки**

Создать `scripts/check-build.ts`:

```typescript
import { readFileSync } from 'node:fs'
import { glob } from 'node:fs/promises'

/**
 * Проверяет сгенерированный HTML.
 *
 * Тесты покрывают запросы и форматирование, но не отвечают на вопрос
 * «получилась ли страница правильной». Здесь проверяется результат:
 * есть ли заголовок, канонический адрес, разметка крошек — и столько ли
 * страниц, сколько ожидается.
 */
const EXPECTED = {
  'farkopy/*/': 106,
  'farkopy/*/*/': 956,
  'farkopy/*/*/*/': 1368,
  'tovar/*/': 5808,
}

async function countPages(pattern: string): Promise<number> {
  let count = 0
  for await (const _ of glob(`.next/server/app/${pattern}*.html`)) count++
  return count
}

async function main() {
  let failed = false

  console.log('Количество страниц:')
  for (const [pattern, expected] of Object.entries(EXPECTED)) {
    const actual = await countPages(pattern)
    const ok = actual === expected
    if (!ok) failed = true
    console.log(`  ${pattern.padEnd(22)} ${String(actual).padStart(5)} из ${expected} ${ok ? '' : '← НЕ СХОДИТСЯ'}`)
  }

  const samples: string[] = []
  for await (const file of glob('.next/server/app/farkopy/*/*/*.html')) {
    samples.push(file)
    if (samples.length >= 3) break
  }

  console.log('')
  console.log('Проверка разметки на выборке:')
  for (const file of samples) {
    const html = readFileSync(file, 'utf8')
    const checks: [string, boolean][] = [
      ['<h1>', html.includes('<h1')],
      ['BreadcrumbList', html.includes('BreadcrumbList')],
      ['canonical', html.includes('rel="canonical"')],
      ['lang="ru"', html.includes('lang="ru"')],
      ['нет «Create Next App»', !html.includes('Create Next App')],
    ]
    const bad = checks.filter(([, ok]) => !ok)
    if (bad.length > 0) {
      failed = true
      console.log(`  ${file}`)
      bad.forEach(([name]) => console.log(`    нет: ${name}`))
    }
  }
  if (!failed) console.log('  нарушений не найдено')

  if (failed) process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
```

Добавить в `package.json` в секцию `scripts`:

```json
"check": "tsx scripts/check-build.ts"
```

- [ ] **Step 6: Собрать и проверить**

Run: `npm run build && npm run check`
Expected:

```
Количество страниц:
  farkopy/*/                 106 из 106
  farkopy/*/*/               956 из 956
  farkopy/*/*/*/            1368 из 1368
  tovar/*/                  5808 из 5808

Проверка разметки на выборке:
  нарушений не найдено
```

- [ ] **Step 7: Прогнать весь набор тестов**

Run: `npm test`
Expected: все проходят, суммарно `117 passed` — 94 прежних плюс 23 новых (8 форматирования, 2 адресов, 13 запросов).

- [ ] **Step 8: Коммит**

```bash
git add -A
git commit -m "feat: каталог, главная и карта сайта"
```

---

## Обнаружено при реализации

**Слаг кузова считается для всей группы сразу.** Изначально он строился из полного названия кузова, и адрес выходил с повтором: `/farkopy/toyota/rav4/toyota-rav4-xa10-1995-2000`, а у Acura ещё и с мешаниной латиницы и транслита — `/farkopy/acura/mdx/akura-mdh-2006-2014`.

Очевидное решение — собрать слаг из кода поколения и годов — оказалось неверным. Проверка на настоящих данных дала **193 коллизии**: у множества кузовов различие не в поколении и не в годах, а в типе кузова. «Шевроле Лачетти седан 2004-2012» и «универсал 2004-2012» дали бы один слаг и схлопнулись бы в одну страницу.

Работающее решение — срезать у названия общее начало, одинаковое для всех кузовов модели. Это марка и модель, которые уже есть в пути; тип кузова при этом остаётся. Коллизий ноль, страниц по-прежнему 1 368.

Отсюда следствие: слаг зависит от соседних кузовов, поэтому считается функцией `buildVariantSlugs()` сразу для всего списка. Дедупликация и вставка в базу обязаны пользоваться одним и тем же результатом — иначе они разойдутся и упрутся в уникальный индекс на пару (модель, слаг).

## Что этот план сознательно не делает

- **Страницы услуг, установки, контента и юридические** — план B, они не блокируют каталог
- **Подбор в шапке** — три выпадающих списка с 106 марками требуют клиентского состояния и отдельной проработки
- **Фильтры на странице кузова** — работают на клиенте и не меняют URL, делаются вместе с подбором
- **Разметка Product, ItemList, LocalBusiness, FAQPage** — идёт в SEO-подпроекте вместе с Метрикой и Вебмастером. Здесь только `BreadcrumbList`, потому что крошки уже есть
- **Изображения** — выводятся по ссылкам на сторонний сайт с чужим водяным знаком. Своё хранилище и обработка — подпроект №3
- **Мобильное меню** — шапка пока прячет навигацию на узких экранах, гамбургер делается вместе с подбором
- **Формы заявок** — кнопки «Узнать цену» пока не отправляют ничего, обработчик появится вместе с админкой
