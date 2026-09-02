'use client'

import { useEffect, useState } from 'react'
import type { CompactProduct, FitmentIndex, PickerBrand, ProductRow } from '@/catalog/queries'
import { ProductFilter } from '@/components/catalog/product-filter'

/**
 * Подбор по всему каталогу: грузит товары и отдаёт их общему фильтру.
 *
 * Своего вида у этого компонента нет — раскладка, поля и сетка живут в
 * ProductFilter, одном на все страницы с товарами. Здесь только то, чем
 * подбор отличается от страницы кузова: там товары приходят вместе со
 * страницей, а тут их 5 808, и держать столько в разметке нельзя —
 * 420 килобайт в HTML у каждого посетителя, включая тех, кто пришёл
 * читать про установку. Отдельным файлом они запрашиваются только при
 * открытии подбора и дальше лежат в кеше.
 */

/** Разворачивает сжатую запись в то, что ждёт карточка товара. */
function toRow(p: CompactProduct): ProductRow {
  const [
    slug,
    article,
    manufacturer,
    price,
    inStock,
    deliveryText,
    ballType,
    towLoadKg,
    verticalLoadKg,
    bumperCut,
    hasPhoto,
  ] = p

  return {
    slug,
    // Адрес предсказуем: файл всегда /images/products/<слаг>.webp.
    // Поэтому в подгружаемом файле лежит бит, а не строка.
    photo: hasPhoto ? `/images/products/${slug}.webp` : null,
    article,
    manufacturer,
    country: null,
    price,
    inStock: inStock === 1,
    deliveryText,
    ballType,
    towLoadKg,
    verticalLoadKg,
    weightKg: null,
    bumperCut: bumperCut === 0 ? 'not_required' : bumperCut === 1 ? 'required' : 'unknown',
    electricsIncluded: null,
    description: '',
    images: [],
    documents: [],
  }
}

export function CatalogFilter() {
  const [products, setProducts] = useState<ProductRow[] | null>(null)
  const [fits, setFits] = useState<FitmentIndex>({})
  const [cars, setCars] = useState<PickerBrand[]>([])
  const [failed, setFailed] = useState(false)

  /*
    Два файла разом: товары со связками и справочник машин. Справочник
    уже отдаётся для строки подбора в шапке, поэтому чаще всего он
    придёт из кеша браузера, а не по сети.
  */
  useEffect(() => {
    let alive = true
    const get = (url: string) =>
      fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))

    Promise.all([get('/tovary.json'), get('/podbor.json')])
      .then(([catalog, index]: [{ products: CompactProduct[]; fits: FitmentIndex }, PickerBrand[]]) => {
        if (!alive) return
        setProducts(catalog.products.map(toRow))
        setFits(catalog.fits)
        setCars(index)
      })
      .catch(() => {
        if (alive) setFailed(true)
      })
    return () => {
      alive = false
    }
  }, [])

  if (failed) {
    return (
      <p className="mt-8 rounded-[var(--radius-card)] border border-line-light bg-white px-7 py-8 text-[15px] leading-[1.6] text-ink-dim">
        Не удалось загрузить каталог. Обновите страницу — или позвоните, подберём по телефону.
      </p>
    )
  }

  if (!products) {
    return (
      <p className="mt-8 rounded-[var(--radius-card)] border border-line-light bg-paper-3 px-7 py-8 text-[15px] text-ink-dim">
        Загружаем каталог…
      </p>
    )
  }

  return <ProductFilter products={products} cars={cars} fits={fits} />
}
