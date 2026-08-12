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

const DEFAULT_PRODUCT: unknown[] = [
  'galia::t030a',
  'T030A',
  'GALIA',
  'Словакия',
  'Оцинкованный фаркоп',
  15990,
  'сегодня',
  '3 шт Сегодня',
  'https://x/?a=T030A',
  'A',
  1750,
  75,
  13.25,
  'not_required',
  false,
  ['https://x/foto/1.jpg'],
  [['https://x/pdf/1.pdf', 'Инструкция']],
]

const DEFAULT_FITMENT: unknown[] = [0, 0, 0, 0, 15990, 'сегодня']

function catalogHtml(overrides: { product?: unknown[]; fitment?: unknown[] } = {}): string {
  const data = {
    brands: [['brand:acura', 'Acura', 'https://x/?farkop=Acura']],
    models: [['brand:acura:model:mdx', 0, 'MDX', 'https://x/?m=MDX']],
    variants: [['brand:acura:model:mdx:variant:v1', 0, 'variant', 'https://x/?kuzov=1']],
    products: [overrides.product ?? DEFAULT_PRODUCT],
    fitments: [overrides.fitment ?? DEFAULT_FITMENT],
  }
  return `<html><body>\n<script id="catalog-data" type="application/json">${JSON.stringify(data)}</script>\n</body></html>`
}

function withProduct(index: number, value: unknown): unknown[] {
  const product = [...DEFAULT_PRODUCT]
  product[index] = value
  return product
}

function withFitment(index: number, value: unknown): unknown[] {
  const fitment = [...DEFAULT_FITMENT]
  fitment[index] = value
  return fitment
}

test('bumperCut "unknown" остаётся unknown', () => {
  const p = extractCatalog(catalogHtml({ product: withProduct(13, 'unknown') })).products[0]
  expect(p.bumperCut).toBe('unknown')
})

test('bumperCut с неизвестной строкой превращается в unknown', () => {
  const p = extractCatalog(catalogHtml({ product: withProduct(13, 'maybe') })).products[0]
  expect(p.bumperCut).toBe('unknown')
})

test('electricsIncluded со строкой "unknown" превращается в null', () => {
  const p = extractCatalog(catalogHtml({ product: withProduct(14, 'unknown') })).products[0]
  expect(p.electricsIncluded).toBeNull()
})

test('country равный null остаётся null', () => {
  const p = extractCatalog(catalogHtml({ product: withProduct(3, null) })).products[0]
  expect(p.country).toBeNull()
})

test('towLoadKg, verticalLoadKg, weightKg равные null остаются null, а не превращаются в 0', () => {
  let product = withProduct(10, null)
  product[11] = null
  product[12] = null
  const p = extractCatalog(catalogHtml({ product })).products[0]
  expect(p.towLoadKg).toBeNull()
  expect(p.verticalLoadKg).toBeNull()
  expect(p.weightKg).toBeNull()
})

test('настоящий ноль в данных остаётся нулём, а не превращается в null', () => {
  let product = withProduct(10, 0)
  product[11] = 0
  product[12] = 0
  const html = catalogHtml({ product, fitment: withFitment(4, 0) })
  const c = extractCatalog(html)
  const p = c.products[0]
  const f = c.fitments[0]
  expect(p.towLoadKg).toBe(0)
  expect(p.verticalLoadKg).toBe(0)
  expect(p.weightKg).toBe(0)
  expect(f.price).toBe(0)
})

test('price связки равный null остаётся null', () => {
  const f = extractCatalog(catalogHtml({ fitment: withFitment(4, null) })).fitments[0]
  expect(f.price).toBeNull()
})

test('images и documents отсутствующие превращаются в пустой массив', () => {
  let product = withProduct(15, undefined)
  product[16] = undefined
  const p = extractCatalog(catalogHtml({ product })).products[0]
  expect(p.images).toEqual([])
  expect(p.documents).toEqual([])
})

test('images и documents не-массив превращаются в пустой массив', () => {
  let product = withProduct(15, 'not-an-array')
  product[16] = 'not-an-array'
  const p = extractCatalog(catalogHtml({ product })).products[0]
  expect(p.images).toEqual([])
  expect(p.documents).toEqual([])
})

test('отсутствующий key товара бросает понятную ошибку', () => {
  const html = catalogHtml({ product: withProduct(0, undefined) })
  expect(() => extractCatalog(html)).toThrow(/key/)
})

test('пустой key товара бросает понятную ошибку', () => {
  const html = catalogHtml({ product: withProduct(0, '') })
  expect(() => extractCatalog(html)).toThrow(/key/)
})

test('price товара равный null бросает понятную ошибку', () => {
  const html = catalogHtml({ product: withProduct(5, null) })
  expect(() => extractCatalog(html)).toThrow(/price/)
})

test('productIndex связки равный null бросает понятную ошибку', () => {
  const html = catalogHtml({ fitment: withFitment(3, null) })
  expect(() => extractCatalog(html)).toThrow(/productIndex/)
})

test('бросает понятную ошибку при битом JSON в блоке данных', () => {
  const html = `<html><body>\n<script id="catalog-data" type="application/json">{not valid json</script>\n</body></html>`
  expect(() => extractCatalog(html)).toThrow()
})
