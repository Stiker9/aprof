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
