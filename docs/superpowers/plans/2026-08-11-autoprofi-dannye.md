# AUTOPROFI — данные: схема, импорт, очистка

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Развернуть спарсенный каталог фаркопов (8,4 МБ HTML с встроенным JSON) в чистую схему PostgreSQL, пригодную для генерации 8 269 страниц каталога.

**Architecture:** Каркас Next.js 15 создаётся сразу, чтобы схема и скрипты импорта жили в одном проекте с будущим сайтом. Данные проходят конвейер из четырёх независимых шагов — извлечение, нормализация, дедупликация, импорт — каждый со своими тестами на чистых функциях. Разработка идёт на PGlite (PostgreSQL, скомпилированный в WASM, ставится как npm-пакет), продакшен — на управляемом PostgreSQL в Timeweb Cloud. Схема Drizzle одна, драйвер выбирается переменной окружения.

**Tech Stack:** Next.js 15 (App Router), TypeScript strict, Tailwind CSS 4, Drizzle ORM, PGlite (разработка) / postgres.js (продакшен), Vitest.

## Global Constraints

- Node.js 24.18.0, npm 11.16.0 — проверено в системе
- Docker и локальный PostgreSQL отсутствуют. Устанавливать их нельзя, разработка идёт на PGlite
- Персональные данные граждан РФ хранятся только на серверах в России (152-ФЗ ч.5 ст.18). Продакшен-БД — Timeweb Cloud. Supabase, Neon, Vercel Postgres запрещены
- TypeScript strict mode, без `any`
- Исходный файл каталога: `E:\всякое\WEB\Подбор_фаркопов_все_марки_инструкции_сертификаты.html`, срез от 27.06.2026, менять его нельзя
- Все сообщения коммитов на русском, формат `тип: описание`
- Рабочая директория проекта: `E:\WEB\AUTOPROFI`

## Контрольные числа

Импорт считается успешным только при точном совпадении с этими значениями. Они получены анализом исходного файла и служат приёмочным критерием.

| Сущность | В источнике | После очистки | Публикуется |
|---|---:|---:|---:|
| Производители | 33 написания | **27** | 27 |
| Марки авто | 129 | 129 | **106** |
| Модели | 1 278 | 1 278 | **956** |
| Кузова | 2 550 | 2 550 | **1 950** |
| Кузова со своей страницей | — | — | **1 369** |
| Товары | 5 808 | 5 808 | 5 808 |
| Связки товар↔кузов | 16 995 | **10 140** | 10 140 |

Дополнительно: 3 562 товара подходят ровно к одному кузову, 2 246 — к двум и более. 581 модель имеет единственный кузов.

---

## File Structure

| Файл | Ответственность |
|---|---|
| `src/db/schema.ts` | Определения таблиц Drizzle. Единственный источник правды о структуре БД |
| `src/db/client.ts` | Создание подключения. Выбирает драйвер PGlite или postgres.js по `DATABASE_MODE` |
| `src/import/extract.ts` | Достаёт JSON из исходного HTML и приводит массивы-кортежи к типизированным объектам |
| `src/import/normalize.ts` | Чистые функции нормализации: производители, названия кузовов, слаги |
| `src/import/dedupe.ts` | Схлопывание дублей связок товар↔кузов |
| `src/import/run.ts` | Оркестратор: читает файл, прогоняет через конвейер, пишет в БД |
| `src/import/counters.ts` | Пересчёт счётчиков и флагов публикации после импорта |
| `scripts/import.ts` | Точка входа для запуска импорта из терминала |

Разделение по ответственности, а не по слоям: нормализация и дедупликация — чистые функции без побочных эффектов, их можно тестировать без БД. Работа с БД сосредоточена в `run.ts` и `counters.ts`.

---

## Task 1: Каркас проекта

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `vitest.config.ts`, `.env.example`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: ничего, это первая задача
- Produces: рабочий проект Next.js с настроенным Vitest. Команды `npm run dev`, `npm run build`, `npm test`

- [ ] **Step 1: Создать проект Next.js**

Выполнить в `E:\WEB\AUTOPROFI`:

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*" --turbopack --yes
```

Установщик спросит про перезапись существующих файлов — согласиться. Папки `docs`, `design`, `.superpowers` он не трогает.

- [ ] **Step 2: Проверить, что проект собирается**

```bash
npm run build
```

Ожидается: сборка завершается без ошибок, в выводе строка `Compiled successfully`.

- [ ] **Step 3: Установить зависимости для БД и тестов**

```bash
npm i drizzle-orm @electric-sql/pglite postgres
npm i -D drizzle-kit vitest @types/node tsx
```

- [ ] **Step 4: Создать конфиг Vitest**

Создать `vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
```

- [ ] **Step 5: Добавить команды в package.json**

В секцию `"scripts"` добавить:

```json
"test": "vitest run",
"test:watch": "vitest",
"import": "tsx scripts/import.ts"
```

- [ ] **Step 6: Создать .env.example**

```
# local — PGlite в файле, никаких установок
# remote — управляемый PostgreSQL (Timeweb Cloud)
DATABASE_MODE=local

# Заполняется только при DATABASE_MODE=remote
DATABASE_URL=

# Путь к файлу базы для локального режима
PGLITE_PATH=./.pgdata
```

- [ ] **Step 7: Дополнить .gitignore**

Добавить строки:

```
.pgdata/
.env
.env.local
```

- [ ] **Step 8: Проверить, что тесты запускаются**

Создать временный файл `src/smoke.test.ts`:

```typescript
import { expect, test } from 'vitest'

test('окружение работает', () => {
  expect(1 + 1).toBe(2)
})
```

Запустить:

```bash
npm test
```

Ожидается: `1 passed`.

- [ ] **Step 9: Удалить временный тест и закоммитить**

```bash
rm src/smoke.test.ts
git add -A
git commit -m "chore: каркас Next.js 15, Drizzle, Vitest"
```

---

## Task 2: Схема базы данных

**Files:**
- Create: `src/db/schema.ts`, `src/db/client.ts`, `src/db/schema.test.ts`, `drizzle.config.ts`

**Interfaces:**
- Consumes: проект из Task 1
- Produces:
  - Таблицы `manufacturers`, `brands`, `models`, `variants`, `products`, `fitments`
  - `getDb(): Promise<DrizzleDb>` — подключение к БД
  - Типы `Manufacturer`, `Brand`, `Model`, `Variant`, `Product`, `Fitment` (выводятся через `$inferSelect`)

- [ ] **Step 1: Написать падающий тест схемы**

Создать `src/db/schema.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { brands, fitments, manufacturers, models, products, variants } from './schema'

test('схема содержит все шесть таблиц с ключевыми полями', () => {
  expect(manufacturers.slug).toBeDefined()
  expect(brands.slug).toBeDefined()
  expect(brands.isPublished).toBeDefined()
  expect(models.brandId).toBeDefined()
  expect(variants.modelId).toBeDefined()
  expect(variants.hasOwnPage).toBeDefined()
  expect(products.article).toBeDefined()
  expect(products.bumperCut).toBeDefined()
  expect(fitments.productId).toBeDefined()
  expect(fitments.variantId).toBeDefined()
})
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/db/schema.test.ts
```

Ожидается: FAIL с сообщением о том, что модуль `./schema` не найден.

- [ ] **Step 3: Написать схему**

Создать `src/db/schema.ts`:

```typescript
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Требуется ли вырез бампера. unknown — данных в источнике нет. */
export const bumperCutEnum = pgEnum('bumper_cut', ['not_required', 'required', 'unknown'])

/** Производители фаркопов: Steinhof, GALIA, Oris и т.д. */
export const manufacturers = pgTable('manufacturers', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  country: text('country'),
})

/** Марки автомобилей */
export const brands = pgTable(
  'brands',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    modelCount: integer('model_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [index('brands_published_idx').on(t.isPublished)],
)

/** Модели автомобилей */
export const models = pgTable(
  'models',
  {
    id: serial('id').primaryKey(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    variantCount: integer('variant_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [uniqueIndex('models_brand_slug_idx').on(t.brandId, t.slug)],
)

/**
 * Кузова (поколения). hasOwnPage=false означает, что у модели это
 * единственный кузов и отдельная страница для него не создаётся —
 * иначе она дублировала бы страницу модели.
 */
export const variants = pgTable(
  'variants',
  {
    id: serial('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    slug: text('slug').notNull(),
    /** Очищенное название из источника, кириллицей: «Тойота РАВ4 XA10 1995-2000» */
    name: text('name').notNull(),
    /**
     * Код поколения латиницей: XA10, E120, F15.
     * null, когда в источнике его нет (Giulia, ZDX, 147).
     * На страницах подпись собирается как
     * `${brand.name} ${model.name} ${generation ?? ''} ${годы}` —
     * иначе рядом с латинским «Toyota» встанет кириллическое «Тойота РАВ4».
     */
    generation: text('generation'),
    yearFrom: integer('year_from'),
    yearTo: integer('year_to'),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    hasOwnPage: boolean('has_own_page').notNull().default(false),
  },
  (t) => [uniqueIndex('variants_model_slug_idx').on(t.modelId, t.slug)],
)

/** Товары-фаркопы */
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    article: text('article').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id),
    description: text('description').notNull(),
    /** Цена из источника (фаркоп.рф). Розничная цена считается отдельно. */
    sourcePrice: integer('source_price').notNull(),
    deliveryText: text('delivery_text'),
    inStock: boolean('in_stock').notNull().default(false),
    ballType: text('ball_type'),
    towLoadKg: integer('tow_load_kg'),
    verticalLoadKg: integer('vertical_load_kg'),
    weightKg: real('weight_kg'),
    bumperCut: bumperCutEnum('bumper_cut').notNull().default('unknown'),
    /** null означает, что данных в источнике нет */
    electricsIncluded: boolean('electrics_included'),
    sourceUrl: text('source_url'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    documents: jsonb('documents').$type<{ url: string; label: string }[]>().notNull().default([]),
  },
  (t) => [index('products_manufacturer_idx').on(t.manufacturerId)],
)

/** Связка «этот фаркоп подходит к этому кузову» */
export const fitments = pgTable(
  'fitments',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id),
    price: integer('price'),
    deliveryText: text('delivery_text'),
  },
  (t) => [
    uniqueIndex('fitments_product_variant_idx').on(t.productId, t.variantId),
    index('fitments_variant_idx').on(t.variantId),
  ],
)

export type Manufacturer = typeof manufacturers.$inferSelect
export type Brand = typeof brands.$inferSelect
export type Model = typeof models.$inferSelect
export type Variant = typeof variants.$inferSelect
export type Product = typeof products.$inferSelect
export type Fitment = typeof fitments.$inferSelect
```

- [ ] **Step 4: Запустить тест, убедиться что проходит**

```bash
npx vitest run src/db/schema.test.ts
```

Ожидается: PASS, `1 passed`.

- [ ] **Step 5: Написать клиент БД**

Создать `src/db/client.ts`:

```typescript
import { PGlite } from '@electric-sql/pglite'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite'
import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

/**
 * Общий надтип для обоих драйверов. Объединение конкретных типов
 * здесь не годится: TypeScript не даст вызвать .execute() на union,
 * потому что сигнатуры драйверов различаются.
 */
export type DrizzleDb = PgDatabase<PgQueryResultHKT, typeof schema>

let cached: DrizzleDb | null = null

/**
 * Подключение к БД. В режиме local поднимает PGlite в файле —
 * настоящий PostgreSQL в WASM, без установки сервера.
 * В режиме remote подключается к управляемому PostgreSQL.
 */
export async function getDb(): Promise<DrizzleDb> {
  if (cached) return cached

  const mode = process.env.DATABASE_MODE ?? 'local'

  if (mode === 'remote') {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_MODE=remote, но DATABASE_URL не задан')
    cached = drizzlePostgres(postgres(url), { schema })
    return cached
  }

  const path = process.env.PGLITE_PATH ?? './.pgdata'
  const client = new PGlite(path)
  cached = drizzlePglite(client, { schema })
  return cached
}
```

- [ ] **Step 6: Создать конфиг Drizzle Kit**

Создать `drizzle.config.ts`:

```typescript
import type { Config } from 'drizzle-kit'

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
} satisfies Config
```

- [ ] **Step 7: Сгенерировать SQL-миграцию**

```bash
npx drizzle-kit generate
```

Ожидается: в папке `drizzle/` появляется файл `0000_*.sql` с командами `CREATE TABLE` для шести таблиц.

- [ ] **Step 8: Закоммитить**

```bash
git add -A
git commit -m "feat: схема БД каталога фаркопов"
```

---

## Task 3: Извлечение данных из исходного HTML

**Files:**
- Create: `src/import/extract.ts`, `src/import/extract.test.ts`

**Interfaces:**
- Consumes: ничего из предыдущих задач
- Produces:
  - `extractCatalog(html: string): RawCatalog`
  - Типы `RawBrand`, `RawModel`, `RawVariant`, `RawProduct`, `RawFitment`, `RawCatalog`

- [ ] **Step 1: Написать падающий тест**

Создать `src/import/extract.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { extractCatalog } from './extract'

const FIXTURE = `<html><body>
<script id="catalog-data" type="application/json">{"meta":{"successfulBrands":1},"brands":[["brand:acura","Acura","https://x/?farkop=Acura"]],"models":[["brand:acura:model:mdx",0,"MDX","https://x/?m=MDX"]],"variants":[["brand:acura:model:mdx:variant:v1",0,"фаркопы для Акура МДХ 2006-2014","https://x/?kuzov=1",0]],"products":[["galia::t030a","T030A","GALIA","Словакия","Оцинкованный фаркоп",15990,"сегодня","3 шт Сегодня","https://x/?a=T030A","A",1750,75,13.25,"not_required",false,["https://x/foto/1.jpg"],[["https://x/pdf/1.pdf","Инструкция"]],"2026-06-26T22:45:01.689Z"]],"fitments":[[0,0,0,0,15990,"сегодня","https://x/v","https://x/p",1]],"stats":{"products":1}}</script>
</body></html>`

test('достаёт все пять массивов из HTML', () => {
  const c = extractCatalog(FIXTURE)
  expect(c.brands).toHaveLength(1)
  expect(c.models).toHaveLength(1)
  expect(c.variants).toHaveLength(1)
  expect(c.products).toHaveLength(1)
  expect(c.fitments).toHaveLength(1)
})

test('раскладывает кортеж товара по именованным полям', () => {
  const p = extractCatalog(FIXTURE).products[0]
  expect(p.article).toBe('T030A')
  expect(p.manufacturerRaw).toBe('GALIA')
  expect(p.country).toBe('Словакия')
  expect(p.price).toBe(15990)
  expect(p.ballType).toBe('A')
  expect(p.towLoadKg).toBe(1750)
  expect(p.verticalLoadKg).toBe(75)
  expect(p.weightKg).toBe(13.25)
  expect(p.bumperCut).toBe('not_required')
  expect(p.electricsIncluded).toBe(false)
  expect(p.images).toEqual(['https://x/foto/1.jpg'])
  expect(p.documents).toEqual([{ url: 'https://x/pdf/1.pdf', label: 'Инструкция' }])
})

test('раскладывает связку по индексам', () => {
  const f = extractCatalog(FIXTURE).fitments[0]
  expect(f.brandIndex).toBe(0)
  expect(f.modelIndex).toBe(0)
  expect(f.variantIndex).toBe(0)
  expect(f.productIndex).toBe(0)
  expect(f.price).toBe(15990)
})

test('бросает понятную ошибку, если блока с данными нет', () => {
  expect(() => extractCatalog('<html></html>')).toThrow(/catalog-data/)
})
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/import/extract.test.ts
```

Ожидается: FAIL, модуль `./extract` не найден.

- [ ] **Step 3: Написать извлечение**

Создать `src/import/extract.ts`:

```typescript
export interface RawBrand {
  key: string
  name: string
  sourceUrl: string
}

export interface RawModel {
  key: string
  brandIndex: number
  name: string
  sourceUrl: string
}

export interface RawVariant {
  key: string
  modelIndex: number
  name: string
  sourceUrl: string
}

export interface RawProduct {
  key: string
  article: string
  manufacturerRaw: string
  country: string | null
  description: string
  price: number
  deliveryShort: string | null
  deliveryText: string | null
  sourceUrl: string | null
  ballType: string | null
  towLoadKg: number | null
  verticalLoadKg: number | null
  weightKg: number | null
  bumperCut: 'not_required' | 'required' | 'unknown'
  electricsIncluded: boolean | null
  images: string[]
  documents: { url: string; label: string }[]
}

export interface RawFitment {
  brandIndex: number
  modelIndex: number
  variantIndex: number
  productIndex: number
  price: number | null
  deliveryShort: string | null
}

export interface RawCatalog {
  brands: RawBrand[]
  models: RawModel[]
  variants: RawVariant[]
  products: RawProduct[]
  fitments: RawFitment[]
}

const num = (v: unknown): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)

function toBumperCut(v: unknown): 'not_required' | 'required' | 'unknown' {
  return v === 'not_required' || v === 'required' ? v : 'unknown'
}

function toElectrics(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null
}

/**
 * Достаёт JSON из тега <script id="catalog-data"> и приводит
 * массивы-кортежи к именованным полям. Порядок полей в кортежах
 * задан генератором исходного файла и здесь зафиксирован.
 */
export function extractCatalog(html: string): RawCatalog {
  const match = html.match(
    /<script[^>]*id="catalog-data"[^>]*>([\s\S]*?)<\/script>/,
  )
  if (!match) {
    throw new Error('В файле не найден блок <script id="catalog-data">')
  }

  const data = JSON.parse(match[1]) as {
    brands: unknown[][]
    models: unknown[][]
    variants: unknown[][]
    products: unknown[][]
    fitments: unknown[][]
  }

  return {
    brands: data.brands.map((b) => ({
      key: String(b[0]),
      name: String(b[1]),
      sourceUrl: String(b[2] ?? ''),
    })),

    models: data.models.map((m) => ({
      key: String(m[0]),
      brandIndex: Number(m[1]),
      name: String(m[2]),
      sourceUrl: String(m[3] ?? ''),
    })),

    variants: data.variants.map((v) => ({
      key: String(v[0]),
      modelIndex: Number(v[1]),
      name: String(v[2]),
      sourceUrl: String(v[3] ?? ''),
    })),

    products: data.products.map((p) => ({
      key: String(p[0]),
      article: String(p[1]),
      manufacturerRaw: String(p[2] ?? ''),
      country: str(p[3]),
      description: String(p[4] ?? ''),
      price: Number(p[5]),
      deliveryShort: str(p[6]),
      deliveryText: str(p[7]),
      sourceUrl: str(p[8]),
      ballType: str(p[9]),
      towLoadKg: num(p[10]),
      verticalLoadKg: num(p[11]),
      weightKg: num(p[12]),
      bumperCut: toBumperCut(p[13]),
      electricsIncluded: toElectrics(p[14]),
      images: Array.isArray(p[15]) ? (p[15] as string[]) : [],
      documents: Array.isArray(p[16])
        ? (p[16] as unknown[][]).map((d) => ({
            url: String(d[0]),
            label: String(d[1] ?? 'Документ'),
          }))
        : [],
    })),

    fitments: data.fitments.map((f) => ({
      brandIndex: Number(f[0]),
      modelIndex: Number(f[1]),
      variantIndex: Number(f[2]),
      productIndex: Number(f[3]),
      price: num(f[4]),
      deliveryShort: str(f[5]),
    })),
  }
}
```

- [ ] **Step 4: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/extract.test.ts
```

Ожидается: PASS, `4 passed`.

- [ ] **Step 5: Проверить на настоящем файле**

Создать временный скрипт `scripts/check-extract.ts`:

```typescript
import { readFileSync } from 'node:fs'
import { extractCatalog } from '../src/import/extract'

const SOURCE = 'E:/всякое/WEB/Подбор_фаркопов_все_марки_инструкции_сертификаты.html'
const c = extractCatalog(readFileSync(SOURCE, 'utf8'))

console.log('brands  ', c.brands.length)
console.log('models  ', c.models.length)
console.log('variants', c.variants.length)
console.log('products', c.products.length)
console.log('fitments', c.fitments.length)
```

Запустить:

```bash
npx tsx scripts/check-extract.ts
```

Ожидается точно:

```
brands   129
models   1278
variants 2550
products 5808
fitments 16995
```

- [ ] **Step 6: Удалить временный скрипт и закоммитить**

```bash
rm scripts/check-extract.ts
git add -A
git commit -m "feat: извлечение каталога из исходного HTML"
```

---

## Task 4: Нормализация производителей

**Files:**
- Create: `src/import/normalize.ts`, `src/import/normalize.test.ts`

**Interfaces:**
- Consumes: типы из `src/import/extract.ts`
- Produces:
  - `normalizeManufacturer(raw: string): string` — каноническое имя
  - `slugify(input: string): string` — слаг из произвольной строки, поддерживает кириллицу

- [ ] **Step 1: Написать падающий тест**

Создать `src/import/normalize.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { normalizeManufacturer, slugify } from './normalize'

test('схлопывает разный регистр в одно имя', () => {
  expect(normalizeManufacturer('Oris')).toBe(normalizeManufacturer('ORIS'))
  expect(normalizeManufacturer('AvtoS')).toBe(normalizeManufacturer('AVTOS'))
  expect(normalizeManufacturer('Berg')).toBe(normalizeManufacturer('BERG'))
  expect(normalizeManufacturer('Motodor')).toBe(normalizeManufacturer('MOTODOR'))
  expect(normalizeManufacturer('Лидер-плюс')).toBe(normalizeManufacturer('ЛИДЕР-ПЛЮС'))
})

test('склеивает ТСС кириллицей и TCC латиницей', () => {
  expect(normalizeManufacturer('ТСС')).toBe(normalizeManufacturer('TCC'))
})

test('выбирает наиболее читаемое написание как каноническое', () => {
  expect(normalizeManufacturer('ORIS')).toBe('Oris')
  expect(normalizeManufacturer('AVTOS')).toBe('AvtoS')
  expect(normalizeManufacturer('ЛИДЕР-ПЛЮС')).toBe('Лидер-плюс')
  expect(normalizeManufacturer('TCC')).toBe('ТСС')
})

test('не трогает производителей без дублей', () => {
  expect(normalizeManufacturer('Steinhof')).toBe('Steinhof')
  expect(normalizeManufacturer('GALIA')).toBe('GALIA')
})

test('slugify переводит кириллицу в латиницу', () => {
  expect(slugify('Лидер-плюс')).toBe('lider-plyus')
  expect(slugify('ТСС')).toBe('tss')
  expect(slugify('Land Cruiser Prado')).toBe('land-cruiser-prado')
  expect(slugify('XA10 · 1995–2000')).toBe('xa10-1995-2000')
})

test('slugify не оставляет пустых строк и двойных дефисов', () => {
  expect(slugify('  A --- B  ')).toBe('a-b')
})
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/import/normalize.test.ts
```

Ожидается: FAIL, модуль `./normalize` не найден.

- [ ] **Step 3: Написать нормализацию**

Создать `src/import/normalize.ts`:

```typescript
/**
 * Канонические написания производителей. Ключ — строка после
 * приведения к нижнему регистру и удаления небуквенных символов.
 * Значение — как выводить на сайте.
 *
 * Отдельно обрабатывается пара ТСС/TCC: это один производитель,
 * записанный кириллицей и латиницей. Автоматически они не склеятся,
 * потому что символы разные, поэтому правило задано явно.
 */
const CANONICAL: Record<string, string> = {
  oris: 'Oris',
  avtos: 'AvtoS',
  berg: 'Berg',
  motodor: 'Motodor',
  лидерплюс: 'Лидер-плюс',
  тсс: 'ТСС',
  tcc: 'ТСС',
}

const foldKey = (s: string): string =>
  s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '')

/** Приводит написание производителя к каноническому виду. */
export function normalizeManufacturer(raw: string): string {
  const trimmed = raw.trim()
  const key = foldKey(trimmed)
  return CANONICAL[key] ?? trimmed
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
}

/** Слаг для URL: кириллица транслитерируется, разделители схлопываются. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

- [ ] **Step 4: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/normalize.test.ts
```

Ожидается: PASS, `6 passed`.

- [ ] **Step 5: Закоммитить**

```bash
git add -A
git commit -m "feat: нормализация производителей и слаги"
```

---

## Task 5: Очистка названий кузовов

**Files:**
- Modify: `src/import/normalize.ts`
- Modify: `src/import/normalize.test.ts`

**Interfaces:**
- Consumes: `slugify` из Task 4
- Produces:
  - `cleanVariantName(raw: string): string` — убирает приставку «фаркопы для»
  - `parseYears(name: string): { from: number | null; to: number | null }`

- [ ] **Step 1: Дописать падающие тесты**

Добавить в конец `src/import/normalize.test.ts`:

```typescript
import { cleanVariantName, parseYears } from './normalize'

test('срезает приставку «фаркопы для»', () => {
  expect(cleanVariantName('фаркопы для Тойота РАВ4 XA10 1995-2000')).toBe(
    'Тойота РАВ4 XA10 1995-2000',
  )
  expect(cleanVariantName('Фаркопы для Ауди А6 1997-2004')).toBe('Ауди А6 1997-2004')
})

test('не трогает названия без приставки', () => {
  expect(cleanVariantName('Giulia')).toBe('Giulia')
  expect(cleanVariantName('ZDX')).toBe('ZDX')
})

test('вытаскивает диапазон годов', () => {
  expect(parseYears('Тойота РАВ4 XA10 1995-2000')).toEqual({ from: 1995, to: 2000 })
  expect(parseYears('Тойота РАВ4 2025-')).toEqual({ from: 2025, to: null })
})

test('возвращает пустые годы, когда их нет в названии', () => {
  expect(parseYears('Giulia')).toEqual({ from: null, to: null })
  expect(parseYears('147')).toEqual({ from: null, to: null })
})

test('вытаскивает код поколения латиницей', () => {
  expect(parseGeneration('Тойота РАВ4 XA10 1995-2000')).toBe('XA10')
  expect(parseGeneration('БМВ Х5 F15 2013-2018')).toBe('F15')
  expect(parseGeneration('Тойота Королла E120 2000-2007')).toBe('E120')
})

test('возвращает null, когда кода поколения нет', () => {
  expect(parseGeneration('Ауди А6 1997-2004')).toBeNull()
  expect(parseGeneration('Giulia')).toBeNull()
  expect(parseGeneration('147')).toBeNull()
})
```

- [ ] **Step 2: Запустить тесты, убедиться что падают**

```bash
npx vitest run src/import/normalize.test.ts
```

Ожидается: FAIL, `cleanVariantName is not a function`.

- [ ] **Step 3: Дописать функции**

Добавить в конец `src/import/normalize.ts`:

```typescript
/**
 * Убирает служебную приставку из названия кузова.
 * В источнике все варианты записаны как «фаркопы для Ауди А6 1997-2004»,
 * на сайте приставка избыточна — мы и так в каталоге фаркопов.
 */
export function cleanVariantName(raw: string): string {
  return raw.replace(/^\s*фаркопы\s+для\s+/i, '').trim()
}

/**
 * Вытаскивает годы из названия кузова.
 * У 818 вариантов из 2550 годов в названии нет — для них
 * возвращается пара null, и это штатная ситуация.
 */
export function parseYears(name: string): { from: number | null; to: number | null } {
  const m = name.match(/(19|20)(\d{2})\s*-\s*((19|20)\d{2})?/)
  if (!m) return { from: null, to: null }

  const from = Number(m[1] + m[2])
  const to = m[3] ? Number(m[3]) : null
  return { from, to }
}

/**
 * Вытаскивает код поколения из названия кузова.
 *
 * В источнике марка и модель записаны кириллицей («Тойота РАВ4»),
 * а на сайте они берутся из своих таблиц латиницей («Toyota RAV4»).
 * Смешивать их в одной строке нельзя, поэтому из названия кузова
 * нужен только код поколения — латинский токен перед годами.
 *
 * Ищется последовательность из латинских букв и цифр, содержащая
 * хотя бы одну букву и одну цифру: XA10, E120, F15, W203.
 * Чистые числа (147, 156) отбрасываются — это названия моделей Alfa Romeo,
 * а не коды поколений.
 */
export function parseGeneration(name: string): string | null {
  const withoutYears = name.replace(/(19|20)\d{2}\s*-\s*((19|20)\d{2})?/g, ' ')
  const tokens = withoutYears.match(/\b[A-Za-z]+[0-9]+[A-Za-z0-9]*\b/g)
  return tokens && tokens.length > 0 ? tokens[tokens.length - 1].toUpperCase() : null
}
```

- [ ] **Step 4: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/normalize.test.ts
```

Ожидается: PASS, `12 passed`.

- [ ] **Step 5: Закоммитить**

```bash
git add -A
git commit -m "feat: очистка названий кузовов, разбор годов и поколений"
```

---

## Task 6: Дедупликация связок

**Files:**
- Create: `src/import/dedupe.ts`, `src/import/dedupe.test.ts`

**Interfaces:**
- Consumes: тип `RawFitment` из `src/import/extract.ts`
- Produces: `dedupeFitments(list: RawFitment[]): RawFitment[]`

- [ ] **Step 1: Написать падающий тест**

Создать `src/import/dedupe.test.ts`:

```typescript
import { expect, test } from 'vitest'
import { dedupeFitments } from './dedupe'
import type { RawFitment } from './extract'

const f = (p: number, v: number, price: number | null = 100): RawFitment => ({
  brandIndex: 0,
  modelIndex: 0,
  variantIndex: v,
  productIndex: p,
  price,
  deliveryShort: null,
})

test('схлопывает повторы одной пары товар-кузов', () => {
  const out = dedupeFitments([f(1, 1), f(1, 1), f(1, 1)])
  expect(out).toHaveLength(1)
})

test('не трогает разные пары', () => {
  const out = dedupeFitments([f(1, 1), f(1, 2), f(2, 1)])
  expect(out).toHaveLength(3)
})

test('при конфликте цен оставляет наименьшую', () => {
  const out = dedupeFitments([f(1, 1, 200), f(1, 1, 150), f(1, 1, 300)])
  expect(out[0].price).toBe(150)
})

test('цена null не вытесняет реальную цену', () => {
  const out = dedupeFitments([f(1, 1, null), f(1, 1, 150)])
  expect(out[0].price).toBe(150)
})

test('пустой вход даёт пустой выход', () => {
  expect(dedupeFitments([])).toEqual([])
})
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/import/dedupe.test.ts
```

Ожидается: FAIL, модуль `./dedupe` не найден.

- [ ] **Step 3: Написать дедупликацию**

Создать `src/import/dedupe.ts`:

```typescript
import type { RawFitment } from './extract'

/**
 * Схлопывает повторяющиеся связки товар↔кузов.
 * В источнике 16 995 записей, но уникальных пар только 10 140 —
 * 40% строк дублируются. Без очистки один и тот же фаркоп
 * показывался бы в списке дважды.
 *
 * При расхождении цен берётся наименьшая: покупателю нельзя
 * показать цену выше той, что есть в данных.
 */
export function dedupeFitments(list: RawFitment[]): RawFitment[] {
  const byPair = new Map<string, RawFitment>()

  for (const item of list) {
    const key = `${item.productIndex}:${item.variantIndex}`
    const existing = byPair.get(key)

    if (!existing) {
      byPair.set(key, item)
      continue
    }

    if (item.price !== null && (existing.price === null || item.price < existing.price)) {
      byPair.set(key, item)
    }
  }

  return [...byPair.values()]
}
```

- [ ] **Step 4: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/dedupe.test.ts
```

Ожидается: PASS, `5 passed`.

- [ ] **Step 5: Закоммитить**

```bash
git add -A
git commit -m "feat: дедупликация связок товар-кузов"
```

---

## Task 7: Импорт в базу

**Files:**
- Create: `src/import/run.ts`, `scripts/import.ts`, `src/import/run.test.ts`

**Interfaces:**
- Consumes: `extractCatalog`, `normalizeManufacturer`, `slugify`, `cleanVariantName`, `parseYears`, `dedupeFitments`, `getDb`, схема
- Produces: `importCatalog(html: string, db: DrizzleDb): Promise<ImportStats>` где `ImportStats = { manufacturers: number; brands: number; models: number; variants: number; products: number; fitments: number }`

- [ ] **Step 1: Написать падающий тест на PGlite в памяти**

Создать `src/import/run.test.ts`:

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, expect, test } from 'vitest'
import * as schema from '../db/schema'
import { importCatalog } from './run'

const MIGRATION = readFileSync('drizzle/0000_init.sql', 'utf8')

const FIXTURE = `<script id="catalog-data" type="application/json">{"brands":[["b:a","Acura","u"],["b:t","Toyota","u"]],"models":[["m:1",0,"MDX","u"],["m:2",1,"RAV4","u"]],"variants":[["v:1",0,"фаркопы для Акура МДХ 2006-2014","u",0],["v:2",1,"фаркопы для Тойота РАВ4 XA10 1995-2000","u",0]],"products":[["oris::x1","X1","ORIS","Словакия","Описание",1000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],["oris::x2","X2","Oris","Польша","Описание",2000,"сегодня","2 шт","u","C",1500,75,12,"required",true,[],[]]],"fitments":[[0,0,0,0,1000,"сегодня","u","u",1],[0,0,0,0,1000,"сегодня","u","u",1],[1,1,1,1,2000,"сегодня","u","u",1]]}</script>`

async function makeDb() {
  const client = new PGlite()
  for (const stmt of MIGRATION.split('--> statement-breakpoint')) {
    if (stmt.trim()) await client.exec(stmt)
  }
  return drizzle(client, { schema })
}

let stats: Awaited<ReturnType<typeof importCatalog>>
let db: Awaited<ReturnType<typeof makeDb>>

beforeAll(async () => {
  db = await makeDb()
  stats = await importCatalog(FIXTURE, db)
})

test('производители схлопнуты в одного', async () => {
  expect(stats.manufacturers).toBe(1)
  const rows = await db.select().from(schema.manufacturers)
  expect(rows[0].name).toBe('Oris')
})

test('дубли связок убраны', () => {
  expect(stats.fitments).toBe(2)
})

test('приставка из названия кузова срезана', async () => {
  const rows = await db.select().from(schema.variants)
  expect(rows.every((v) => !v.name.startsWith('фаркопы для'))).toBe(true)
})

test('годы разобраны', async () => {
  const rows = await db.select().from(schema.variants)
  const rav = rows.find((v) => v.name.includes('РАВ4'))
  expect(rav?.yearFrom).toBe(1995)
  expect(rav?.yearTo).toBe(2000)
})

test('все сущности записаны', () => {
  expect(stats.brands).toBe(2)
  expect(stats.models).toBe(2)
  expect(stats.variants).toBe(2)
  expect(stats.products).toBe(2)
})
```

- [ ] **Step 2: Переименовать миграцию для предсказуемого пути**

Файл в `drizzle/` создан с случайным именем. Переименовать его:

```bash
mv drizzle/0000_*.sql drizzle/0000_init.sql
```

- [ ] **Step 3: Запустить тест, убедиться что падает**

```bash
npx vitest run src/import/run.test.ts
```

Ожидается: FAIL, модуль `./run` не найден.

- [ ] **Step 4: Написать импорт**

Создать `src/import/run.ts`:

```typescript
import type { DrizzleDb } from '../db/client'
import { brands, fitments, manufacturers, models, products, variants } from '../db/schema'
import { dedupeFitments } from './dedupe'
import { extractCatalog } from './extract'
import {
  cleanVariantName,
  normalizeManufacturer,
  parseGeneration,
  parseYears,
  slugify,
} from './normalize'

export interface ImportStats {
  manufacturers: number
  brands: number
  models: number
  variants: number
  products: number
  fitments: number
}

/** Признак наличия на складе: «сегодня» означает отгрузку сразу. */
const isInStock = (deliveryShort: string | null): boolean =>
  (deliveryShort ?? '').toLowerCase().includes('сегодня')

/**
 * Разворачивает исходный каталог в БД.
 * Порядок вставки продиктован внешними ключами:
 * производители → марки → модели → кузова → товары → связки.
 */
export async function importCatalog(html: string, db: DrizzleDb): Promise<ImportStats> {
  const raw = extractCatalog(html)

  // --- производители ---
  const canonicalNames = new Map<string, string | null>()
  for (const p of raw.products) {
    const name = normalizeManufacturer(p.manufacturerRaw)
    if (!canonicalNames.has(name)) canonicalNames.set(name, p.country)
  }

  const manufacturerRows = await db
    .insert(manufacturers)
    .values(
      [...canonicalNames.entries()].map(([name, country]) => ({
        slug: slugify(name),
        name,
        country,
      })),
    )
    .returning()

  const manufacturerIdByName = new Map(manufacturerRows.map((m) => [m.name, m.id]))

  // --- марки ---
  const brandRows = await db
    .insert(brands)
    .values(
      raw.brands.map((b) => ({
        slug: slugify(b.name),
        name: b.name,
        sourceUrl: b.sourceUrl,
      })),
    )
    .returning()

  const brandIdByIndex = new Map(brandRows.map((b, i) => [i, b.id]))

  // --- модели ---
  const modelRows = await db
    .insert(models)
    .values(
      raw.models.map((m) => ({
        brandId: brandIdByIndex.get(m.brandIndex)!,
        slug: slugify(m.name),
        name: m.name,
        sourceUrl: m.sourceUrl,
      })),
    )
    .returning()

  const modelIdByIndex = new Map(modelRows.map((m, i) => [i, m.id]))

  // --- кузова ---
  const variantRows = await db
    .insert(variants)
    .values(
      raw.variants.map((v) => {
        const name = cleanVariantName(v.name)
        const years = parseYears(name)
        return {
          modelId: modelIdByIndex.get(v.modelIndex)!,
          slug: slugify(name),
          name,
          generation: parseGeneration(name),
          yearFrom: years.from,
          yearTo: years.to,
          sourceUrl: v.sourceUrl,
        }
      }),
    )
    .returning()

  const variantIdByIndex = new Map(variantRows.map((v, i) => [i, v.id]))

  // --- товары ---
  const productRows = await db
    .insert(products)
    .values(
      raw.products.map((p) => ({
        slug: slugify(p.article),
        article: p.article,
        manufacturerId: manufacturerIdByName.get(normalizeManufacturer(p.manufacturerRaw))!,
        description: p.description,
        sourcePrice: p.price,
        deliveryText: p.deliveryText,
        inStock: isInStock(p.deliveryShort),
        ballType: p.ballType,
        towLoadKg: p.towLoadKg,
        verticalLoadKg: p.verticalLoadKg,
        weightKg: p.weightKg,
        bumperCut: p.bumperCut,
        electricsIncluded: p.electricsIncluded,
        sourceUrl: p.sourceUrl,
        images: p.images,
        documents: p.documents,
      })),
    )
    .returning()

  const productIdByIndex = new Map(productRows.map((p, i) => [i, p.id]))

  // --- связки ---
  const clean = dedupeFitments(raw.fitments)
  const fitmentRows = await db
    .insert(fitments)
    .values(
      clean.map((f) => ({
        productId: productIdByIndex.get(f.productIndex)!,
        variantId: variantIdByIndex.get(f.variantIndex)!,
        price: f.price,
        deliveryText: f.deliveryShort,
      })),
    )
    .returning()

  return {
    manufacturers: manufacturerRows.length,
    brands: brandRows.length,
    models: modelRows.length,
    variants: variantRows.length,
    products: productRows.length,
    fitments: fitmentRows.length,
  }
}
```

- [ ] **Step 5: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/run.test.ts
```

Ожидается: PASS, `5 passed`.

- [ ] **Step 6: Написать точку входа**

Создать `scripts/import.ts`:

```typescript
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import * as schema from '../src/db/schema'
import { importCatalog } from '../src/import/run'

const SOURCE = 'E:/всякое/WEB/Подбор_фаркопов_все_марки_инструкции_сертификаты.html'
const DB_PATH = process.env.PGLITE_PATH ?? './.pgdata'

async function main() {
  console.log('Очищаю старую базу…')
  await rm(DB_PATH, { recursive: true, force: true })

  const client = new PGlite(DB_PATH)
  const migration = readFileSync('drizzle/0000_init.sql', 'utf8')
  for (const stmt of migration.split('--> statement-breakpoint')) {
    if (stmt.trim()) await client.exec(stmt)
  }

  const db = drizzle(client, { schema })

  console.log('Читаю исходный файл…')
  const html = readFileSync(SOURCE, 'utf8')

  console.log('Импортирую…')
  const stats = await importCatalog(html, db)

  console.log('')
  console.log('Производители:', stats.manufacturers)
  console.log('Марки:        ', stats.brands)
  console.log('Модели:       ', stats.models)
  console.log('Кузова:       ', stats.variants)
  console.log('Товары:       ', stats.products)
  console.log('Связки:       ', stats.fitments)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
```

- [ ] **Step 7: Запустить импорт на настоящих данных**

```bash
npm run import
```

Ожидается точно:

```
Производители: 27
Марки:         129
Модели:        1278
Кузова:        2550
Товары:        5808
Связки:        10140
```

Если производителей не 27 — проверить таблицу `CANONICAL` в `normalize.ts`.
Если связок не 10 140 — проверить `dedupeFitments`.

- [ ] **Step 8: Закоммитить**

```bash
git add -A
git commit -m "feat: импорт каталога в базу"
```

---

## Task 8: Счётчики и флаги публикации

**Files:**
- Create: `src/import/counters.ts`, `src/import/counters.test.ts`
- Modify: `scripts/import.ts`

**Interfaces:**
- Consumes: `DrizzleDb`, схема
- Produces: `recalculateCounters(db: DrizzleDb): Promise<CounterStats>` где `CounterStats = { publishedBrands: number; publishedModels: number; publishedVariants: number; variantsWithOwnPage: number }`

- [ ] **Step 1: Написать падающий тест**

Создать `src/import/counters.test.ts`:

```typescript
import { PGlite } from '@electric-sql/pglite'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/pglite'
import { readFileSync } from 'node:fs'
import { beforeAll, expect, test } from 'vitest'
import * as schema from '../db/schema'
import { recalculateCounters } from './counters'
import { importCatalog } from './run'

const MIGRATION = readFileSync('drizzle/0000_init.sql', 'utf8')

/**
 * Марка A: модель с одним кузовом и товаром → кузов без своей страницы
 * Марка B: модель с двумя кузовами и товарами → оба кузова со страницами
 * Марка C: модель без товаров → не публикуется
 */
const FIXTURE = `<script id="catalog-data" type="application/json">{"brands":[["b:a","Alfa","u"],["b:b","Bmw","u"],["b:c","Chery","u"]],"models":[["m:a",0,"Giulia","u"],["m:b",1,"X5","u"],["m:c",2,"Tiggo","u"]],"variants":[["v:1",0,"Giulia 2016-2020","u",0],["v:2",1,"X5 E70 2007-2013","u",0],["v:3",1,"X5 F15 2013-2018","u",0],["v:4",2,"Tiggo 2020-","u",0]],"products":[["a::p1","P1","GALIA","Словакия","Опис",1000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],["a::p2","P2","GALIA","Словакия","Опис",2000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]],["a::p3","P3","GALIA","Словакия","Опис",3000,"сегодня","1 шт","u","A",1000,50,10,"not_required",false,[],[]]],"fitments":[[0,0,0,0,1000,"сегодня","u","u",1],[1,1,1,1,2000,"сегодня","u","u",1],[1,1,2,2,3000,"сегодня","u","u",1]]}</script>`

let db: ReturnType<typeof drizzle<typeof schema>>

beforeAll(async () => {
  const client = new PGlite()
  for (const stmt of MIGRATION.split('--> statement-breakpoint')) {
    if (stmt.trim()) await client.exec(stmt)
  }
  db = drizzle(client, { schema })
  await importCatalog(FIXTURE, db)
  await recalculateCounters(db)
})

test('марка без товаров не публикуется', async () => {
  const rows = await db.select().from(schema.brands).where(eq(schema.brands.name, 'Chery'))
  expect(rows[0].isPublished).toBe(false)
})

test('марка с товарами публикуется и знает их количество', async () => {
  const rows = await db.select().from(schema.brands).where(eq(schema.brands.name, 'Bmw'))
  expect(rows[0].isPublished).toBe(true)
  expect(rows[0].productCount).toBe(2)
})

test('единственный кузов модели не получает своей страницы', async () => {
  const rows = await db.select().from(schema.variants).where(eq(schema.variants.slug, 'giulia-2016-2020'))
  expect(rows[0].isPublished).toBe(true)
  expect(rows[0].hasOwnPage).toBe(false)
})

test('кузова модели с несколькими поколениями получают страницы', async () => {
  const rows = await db.select().from(schema.variants).where(eq(schema.variants.slug, 'x5-e70-2007-2013'))
  expect(rows[0].hasOwnPage).toBe(true)
})

test('кузов без товаров не публикуется', async () => {
  const rows = await db.select().from(schema.variants).where(eq(schema.variants.slug, 'tiggo-2020'))
  expect(rows[0].isPublished).toBe(false)
})
```

- [ ] **Step 2: Запустить тест, убедиться что падает**

```bash
npx vitest run src/import/counters.test.ts
```

Ожидается: FAIL, модуль `./counters` не найден.

- [ ] **Step 3: Написать пересчёт**

Создать `src/import/counters.ts`:

```typescript
import { sql } from 'drizzle-orm'
import type { DrizzleDb } from '../db/client'

export interface CounterStats {
  publishedBrands: number
  publishedModels: number
  publishedVariants: number
  variantsWithOwnPage: number
}

/**
 * Пересчитывает счётчики товаров и решает, что публиковать.
 *
 * Два правила из спецификации:
 * 1. Пустые ветки не публикуются — марки, модели и кузова без товаров
 *    не должны попадать в sitemap, иначе Яндекс увидит малополезные страницы.
 * 2. Если у модели ровно один непустой кузов, отдельная страница кузова
 *    не создаётся: она дублировала бы страницу модели.
 */
export async function recalculateCounters(db: DrizzleDb): Promise<CounterStats> {
  // Товары на кузов
  await db.execute(sql`
    UPDATE variants v
    SET product_count = COALESCE(c.cnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT variant_id, COUNT(DISTINCT product_id) AS cnt
      FROM fitments GROUP BY variant_id
    ) c
    WHERE c.variant_id = v.id
  `)

  // Товары на модель
  await db.execute(sql`
    UPDATE models m
    SET product_count = COALESCE(c.cnt, 0),
        variant_count = COALESCE(c.vcnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT v.model_id,
             COUNT(DISTINCT f.product_id) AS cnt,
             COUNT(DISTINCT v.id) FILTER (WHERE v.is_published) AS vcnt
      FROM variants v
      JOIN fitments f ON f.variant_id = v.id
      GROUP BY v.model_id
    ) c
    WHERE c.model_id = m.id
  `)

  // Товары на марку
  await db.execute(sql`
    UPDATE brands b
    SET product_count = COALESCE(c.cnt, 0),
        model_count   = COALESCE(c.mcnt, 0),
        is_published  = COALESCE(c.cnt, 0) > 0
    FROM (
      SELECT m.brand_id,
             COUNT(DISTINCT f.product_id) AS cnt,
             COUNT(DISTINCT m.id) AS mcnt
      FROM models m
      JOIN variants v ON v.model_id = m.id
      JOIN fitments f ON f.variant_id = v.id
      GROUP BY m.brand_id
    ) c
    WHERE c.brand_id = b.id
  `)

  // Своя страница только у кузовов моделей, где непустых кузовов больше одного
  await db.execute(sql`
    UPDATE variants v
    SET has_own_page = TRUE
    WHERE v.is_published
      AND (
        SELECT COUNT(*) FROM variants x
        WHERE x.model_id = v.model_id AND x.is_published
      ) > 1
  `)

  const [row] = await db.execute<{
    brands: number
    models: number
    variants: number
    own_pages: number
  }>(sql`
    SELECT
      (SELECT COUNT(*) FROM brands   WHERE is_published)   AS brands,
      (SELECT COUNT(*) FROM models   WHERE is_published)   AS models,
      (SELECT COUNT(*) FROM variants WHERE is_published)   AS variants,
      (SELECT COUNT(*) FROM variants WHERE has_own_page)   AS own_pages
  `)

  return {
    publishedBrands: Number(row.brands),
    publishedModels: Number(row.models),
    publishedVariants: Number(row.variants),
    variantsWithOwnPage: Number(row.own_pages),
  }
}
```

- [ ] **Step 4: Запустить тесты, убедиться что проходят**

```bash
npx vitest run src/import/counters.test.ts
```

Ожидается: PASS, `5 passed`.

- [ ] **Step 5: Подключить пересчёт к импорту**

В `scripts/import.ts` добавить импорт вверху файла:

```typescript
import { recalculateCounters } from '../src/import/counters'
```

И в конце функции `main`, после вывода статистики импорта, дописать:

```typescript
  console.log('')
  console.log('Пересчитываю счётчики…')
  const counters = await recalculateCounters(db)

  console.log('')
  console.log('Публикуется марок:          ', counters.publishedBrands)
  console.log('Публикуется моделей:        ', counters.publishedModels)
  console.log('Публикуется кузовов:        ', counters.publishedVariants)
  console.log('Кузовов со своей страницей: ', counters.variantsWithOwnPage)
  console.log('')
  console.log(
    'Итого страниц каталога:',
    counters.publishedBrands +
      counters.publishedModels +
      counters.variantsWithOwnPage +
      stats.products,
  )
```

- [ ] **Step 6: Запустить полный импорт**

```bash
npm run import
```

Ожидается точно:

```
Производители: 27
Марки:         129
Модели:        1278
Кузова:        2550
Товары:        5808
Связки:        10140

Публикуется марок:           106
Публикуется моделей:         956
Публикуется кузовов:         1950
Кузовов со своей страницей:  1369

Итого страниц каталога: 8239
```

Число 8 239 — это марки, модели, кузова со своими страницами и товары. Вместе с главной, каталогом, страницей указателя и 27 страницами производителей получается 8 269 из спецификации.

- [ ] **Step 7: Прогнать весь набор тестов**

```bash
npm test
```

Ожидается: все файлы проходят, суммарно `32 passed` — схема 1, извлечение 4, нормализация 12, дедупликация 5, импорт 5, счётчики 5.

- [ ] **Step 8: Закоммитить**

```bash
git add -A
git commit -m "feat: счётчики товаров и флаги публикации"
```

---

## Что этот план сознательно не делает

Эти пункты входят в следующие подпроекты и здесь не реализуются:

- **Розничные цены и наценка.** В БД лежит только `sourcePrice` — цена из источника. Ценовая политика заказчика не определена (открытый вопрос №5), поэтому поле для розничной цены появится тогда, когда будут правила
- **Изображения.** В `products.images` лежат ссылки на сторонний сайт с чужим водяным знаком. Скачивание и обработка — отдельный подпроект №3
- **Тексты страниц кузовов.** Генерация уникальных описаний для 1 369 страниц — задача SEO-подпроекта
- **Подключение к Timeweb Cloud.** Клиент готов к переключению через `DATABASE_MODE=remote`, но сам перенос делается при деплое
- **Вёрстка.** Ни одной страницы сайта этот план не создаёт, только данные под них
