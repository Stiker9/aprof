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
              {totalProducts.toLocaleString('ru-RU').replace(/ /g, ' ')}
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
          Весь каталог →{' '}
          <span className="text-ink-dim">
            ещё {formatCount(brands.length - popular.length, 'марка', 'марки', 'марок')}
          </span>
        </Link>
      </section>
    </main>
  )
}
