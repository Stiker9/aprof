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

/**
 * Необязательное число. Возвращает null, когда данных нет.
 *
 * Проверка на null и undefined ОБЯЗАТЕЛЬНА и идёт первой:
 * Number(null) === 0, а ноль — конечное число, поэтому без этой
 * проверки отсутствующая нагрузка или цена превратились бы в 0
 * и ушли бы в базу как достоверное значение.
 */
const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)

/**
 * Обязательное число: индекс связи или цена товара.
 * Битое значение здесь рвёт целостность каталога, поэтому падаем сразу
 * и с указанием места, а не пропускаем NaN дальше.
 */
function requireNumber(v: unknown, field: string, index: number): number {
  const n = num(v)
  if (n === null) {
    throw new Error(`Поле «${field}» в записи №${index} пустое или не число: ${JSON.stringify(v)}`)
  }
  return n
}

/** Обязательная строка: ключ записи. Пустой ключ ломает связи. */
function requireString(v: unknown, field: string, index: number): string {
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error(`Поле «${field}» в записи №${index} пустое или не строка: ${JSON.stringify(v)}`)
  }
  return v
}

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
    brands: data.brands.map((b, i) => ({
      key: requireString(b[0], 'key', i),
      name: String(b[1]),
      sourceUrl: String(b[2] ?? ''),
    })),

    models: data.models.map((m, i) => ({
      key: requireString(m[0], 'key', i),
      brandIndex: requireNumber(m[1], 'brandIndex', i),
      name: String(m[2]),
      sourceUrl: String(m[3] ?? ''),
    })),

    variants: data.variants.map((v, i) => ({
      key: requireString(v[0], 'key', i),
      modelIndex: requireNumber(v[1], 'modelIndex', i),
      name: String(v[2]),
      sourceUrl: String(v[3] ?? ''),
    })),

    products: data.products.map((p, i) => ({
      key: requireString(p[0], 'key', i),
      article: requireString(p[1], 'article', i),
      manufacturerRaw: String(p[2] ?? ''),
      country: str(p[3]),
      description: String(p[4] ?? ''),
      price: requireNumber(p[5], 'price', i),
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

    fitments: data.fitments.map((f, i) => ({
      brandIndex: requireNumber(f[0], 'brandIndex', i),
      modelIndex: requireNumber(f[1], 'modelIndex', i),
      variantIndex: requireNumber(f[2], 'variantIndex', i),
      productIndex: requireNumber(f[3], 'productIndex', i),
      price: num(f[4]),
      deliveryShort: str(f[5]),
    })),
  }
}
