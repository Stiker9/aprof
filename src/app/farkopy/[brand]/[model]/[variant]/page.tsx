import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatCount, formatPrice, formatVariantLabel, formatVariantShort } from '@/catalog/format'
import {
  getBrand,
  getModel,
  getVariant,
  listAllVariantPaths,
  listProductsForVariant,
  listVariants,
} from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { ProductCard } from '@/components/product-card'
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
          {
            label:
              formatVariantShort(
                data.variant.generation,
                data.variant.yearFrom,
                data.variant.yearTo,
              ) || data.model.name,
          },
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
                  {formatVariantShort(sibling.generation, sibling.yearFrom, sibling.yearTo) ||
                    data.model.name}
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
