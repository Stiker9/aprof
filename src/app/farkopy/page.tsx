import type { Metadata } from 'next'
import Link from 'next/link'
import { formatCount } from '@/catalog/format'
import { listBrands } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
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
