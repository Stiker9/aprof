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
