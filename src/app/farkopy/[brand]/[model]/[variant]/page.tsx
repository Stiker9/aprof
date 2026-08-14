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
import { CatalogShell, CatalogTile } from '@/components/catalog/shell'
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

  const short =
    formatVariantShort(data.variant.generation, data.variant.yearFrom, data.variant.yearTo) ||
    data.model.name

  return (
    <CatalogShell
      picker={{ brand: data.brand.name, model: data.model.name, variant: short }}
      crumbs={[
        { label: 'Главная', href: urls.home() },
        { label: 'Фаркопы', href: urls.catalog() },
        { label: data.brand.name, href: urls.brand(brand) },
        { label: data.model.name, href: urls.model(brand, model) },
        { label: short },
      ]}
      title={`Фаркопы на ${label}`}
      summary={
        <>
          {formatCount(data.products.length, 'фаркоп', 'фаркопа', 'фаркопов')}
          {cheapest ? ` · цены от ${formatPrice(cheapest.price)}` : ''} · установка за 3 часа
        </>
      }
    >
      <div className="mt-10 space-y-4">
        {data.products.map((product) => (
          <ProductCard key={product.slug} product={product} />
        ))}
      </div>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-[var(--radius-block)] border border-line-light bg-white p-7">
          <h2 className="text-[19px] font-medium">Установка в Петербурге</h2>
          <p className="mt-2 text-sm opacity-60">
            3 часа работы, гарантия 2 года, документы для ТО. Софийская ул. 72.
          </p>
          <Link href="/ustanovka-farkopa" className="mt-4 inline-block text-accent hover:underline">
            Цены на установку →
          </Link>
        </div>
        <div className="rounded-[var(--radius-block)] border border-line-light bg-white p-7">
          <h2 className="text-[19px] font-medium">Доставка по России</h2>
          <p className="mt-2 text-sm opacity-60">
            СДЭК в 1 100 городов, до двери или в пункт выдачи, с отслеживанием.
          </p>
          <Link href="/dostavka" className="mt-4 inline-block text-accent hover:underline">
            Рассчитать доставку →
          </Link>
        </div>
      </section>

      {others.length > 0 && (
        <section className="mt-12">
          <h2 className="text-[19px] font-medium">Другие поколения {data.model.name}</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((sibling) => (
              <CatalogTile
                key={sibling.slug}
                href={urls.variant(brand, model, sibling.slug)}
                title={
                  formatVariantShort(sibling.generation, sibling.yearFrom, sibling.yearTo) ||
                  data.model.name
                }
                count={formatCount(sibling.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
              />
            ))}
          </div>
        </section>
      )}
    </CatalogShell>
  )
}
