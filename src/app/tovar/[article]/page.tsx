import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatPrice, formatVariantLabel } from '@/catalog/format'
import { getProduct, listAllProductSlugs, listVariantsForProduct } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { Breadcrumbs } from '@/components/breadcrumbs'
import { getDb } from '@/db/client'

interface Params {
  params: Promise<{ article: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const slugs = await listAllProductSlugs(db)
  return slugs.map((article) => ({ article }))
}

const BUMPER_TEXT = {
  not_required: 'не требуется',
  required: 'требуется',
  unknown: 'нет данных',
} as const

async function load(articleSlug: string) {
  const db = await getDb()
  const product = await getProduct(db, articleSlug)
  if (!product) return null
  const fits = await listVariantsForProduct(db, articleSlug)
  return { product, fits }
}

/**
 * Заголовок бывает двух видов.
 *
 * Если фаркоп подходит ровно к одной машине — она входит в заголовок,
 * и страница ловит запросы вида «фаркоп на рав4 xa10 galia». Таких
 * товаров 61%. Если машин несколько, заголовок обезличенный, иначе
 * страница врала бы про совместимость.
 */
function buildTitle(
  article: string,
  manufacturer: string,
  fits: Awaited<ReturnType<typeof listVariantsForProduct>>,
): string {
  if (fits.length !== 1) return `Фаркоп ${manufacturer} ${article}`
  const only = fits[0]
  const label = formatVariantLabel(
    only.brand,
    only.model,
    only.variant.generation,
    only.variant.yearFrom,
    only.variant.yearTo,
  )
  return `Фаркоп ${manufacturer} ${article} на ${label}`
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { article } = await params
  const data = await load(article)
  if (!data) return {}

  const title = buildTitle(data.product.article, data.product.manufacturer, data.fits)
  return {
    title: `${title} — купить с установкой`,
    description: data.product.description.slice(0, 300),
    alternates: { canonical: absolute(urls.product(article)) },
  }
}

export default async function ProductPage({ params }: Params) {
  const { article } = await params
  const data = await load(article)
  if (!data) notFound()

  const { product, fits } = data
  const title = buildTitle(product.article, product.manufacturer, fits)
  const first = fits[0]

  const specs: [string, string][] = [
    ['Тип шара', product.ballType ?? 'нет данных'],
    ['Тяговая нагрузка', product.towLoadKg ? `${product.towLoadKg} кг` : 'нет данных'],
    [
      'Вертикальная нагрузка',
      product.verticalLoadKg ? `${product.verticalLoadKg} кг` : 'нет данных',
    ],
    ['Масса фаркопа', product.weightKg ? `${product.weightKg} кг` : 'нет данных'],
    ['Вырез бампера', BUMPER_TEXT[product.bumperCut]],
    [
      'Электрика в комплекте',
      product.electricsIncluded === null ? 'нет данных' : product.electricsIncluded ? 'да' : 'нет',
    ],
    ['Страна производства', product.country ?? 'нет данных'],
  ]

  return (
    <main className="mx-auto w-full max-w-[1400px] px-6 py-8">
      <Breadcrumbs
        items={[
          { label: 'Главная', href: urls.home() },
          { label: 'Фаркопы', href: urls.catalog() },
          ...(first
            ? [
                { label: first.brand, href: urls.brand(first.brandSlug) },
                { label: first.model, href: urls.model(first.brandSlug, first.modelSlug) },
              ]
            : []),
          { label: product.article },
        ]}
      />

      <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-ink">{title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div>
          <div className="flex aspect-4/3 items-center justify-center rounded-[var(--radius-card)] bg-surface-2">
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={`Фаркоп ${product.article}`}
                className="h-full w-full rounded-[var(--radius-card)] object-contain"
              />
            ) : (
              <span className="text-ink-dim">нет фото</span>
            )}
          </div>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
            Характеристики
          </h2>
          <dl className="mt-4">
            {specs.map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-line py-3 text-sm">
                <dt className="text-ink-muted">{key}</dt>
                <dd className="text-ink">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
            Описание
          </h2>
          <p className="mt-3 text-ink-muted">{product.description}</p>

          {product.documents.length > 0 && (
            <>
              <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
                Документы
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {product.documents.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line p-4 text-sm text-ink"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-white">
                      PDF
                    </span>
                    {doc.label}
                  </a>
                ))}
              </div>
            </>
          )}

          {fits.length > 0 && (
            <>
              <h2 className="mt-10 font-[family-name:var(--font-display)] text-xl text-ink">
                Подходит к автомобилям
              </h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {fits.map((fit) => (
                  <Link
                    key={`${fit.brandSlug}-${fit.modelSlug}-${fit.variant.slug}`}
                    href={
                      fit.variant.hasOwnPage
                        ? urls.variant(fit.brandSlug, fit.modelSlug, fit.variant.slug)
                        : urls.model(fit.brandSlug, fit.modelSlug)
                    }
                    className="rounded-[var(--radius-card)] border border-line p-4 text-sm"
                  >
                    <span className="block text-ink">
                      {fit.brand} {fit.model}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {formatVariantLabel(
                        '',
                        '',
                        fit.variant.generation,
                        fit.variant.yearFrom,
                        fit.variant.yearTo,
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-[var(--radius-block)] border border-line bg-surface p-6 lg:sticky lg:top-6">
          <div className="text-sm text-ink-muted">
            {product.manufacturer}
            {product.country ? ` · ${product.country}` : ''} · артикул {product.article}
          </div>
          <div className="mt-3 text-3xl font-bold text-accent">{formatPrice(product.price)}</div>
          <div
            className={`mt-3 inline-block rounded px-2 py-1 text-xs font-semibold ${
              product.inStock ? 'bg-in-stock/15 text-in-stock' : 'bg-on-order/15 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </div>
          <button
            type="button"
            className="mt-6 w-full rounded-lg bg-accent px-4 py-3 font-semibold text-white"
          >
            Узнать цену
          </button>
          <Link
            href="/ustanovka-farkopa"
            className="mt-3 block w-full rounded-lg border border-line px-4 py-3 text-center text-ink"
          >
            Записаться на установку
          </Link>
          <a href="tel:+78121234567" className="mt-6 block text-xl font-bold text-ink">
            +7 (812) 123-45-67
          </a>
          <p className="mt-2 text-xs text-ink-dim">Гарантия 2 года · документы для ТО</p>
        </aside>
      </div>
    </main>
  )
}
