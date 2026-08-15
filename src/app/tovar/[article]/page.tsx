import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  formatNumber,
  formatPrice,
  formatVariantLabel,
  formatVariantShort,
} from '@/catalog/format'
import { getProduct, listAllProductSlugs, listVariantsForProduct } from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell, CatalogTile } from '@/components/catalog/shell'
import { Tabs } from '@/components/ui/tabs'
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
    ['Масса фаркопа', product.weightKg ? `${formatNumber(product.weightKg)} кг` : 'нет данных'],
    ['Вырез бампера', BUMPER_TEXT[product.bumperCut]],
    [
      'Электрика в комплекте',
      product.electricsIncluded === null ? 'нет данных' : product.electricsIncluded ? 'да' : 'нет',
    ],
    ['Страна производства', product.country ?? 'нет данных'],
  ]

  return (
    <CatalogShell
      picker={
        first
          ? {
              brand: first.brand,
              model: first.model,
              variant: formatVariantShort(
                first.variant.generation,
                first.variant.yearFrom,
                first.variant.yearTo,
              ),
            }
          : undefined
      }
      crumbs={[
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
      title={title}
    >
      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-[var(--radius-card)] border border-line-light bg-white">
            {/*
              Снимки товаров лежат на стороннем сайте и несут чужой
              водяной знак — до их обработки показываем кадр из макета,
              чтобы карточка не выглядела пустой.
            */}
            {product.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[0]}
                alt={`Фаркоп ${product.article}`}
                className="h-full w-full object-contain"
              />
            ) : (
              <Image
                src="/images/product-sample.webp"
                alt={`Фаркоп ${product.article}`}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-contain"
              />
            )}
          </div>

          {/*
            Остальные снимки лентой. Монтажные схемы лежат в том же поле,
            что и фотографии, и отличить их без разбора адресов нельзя —
            отдельным блоком «СХЕМА», как в макете, они станут после
            разбора изображений.
          */}
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3 overflow-x-auto pb-1">
              {product.images.slice(1, 7).map((src) => (
                <div
                  key={src}
                  className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-line-light bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-12 text-[19px] font-medium">Характеристики</h2>
          <dl className="mt-5">
            {specs.map(([key, value]) => (
              <div
                key={key}
                className="flex justify-between gap-6 border-b border-line-light py-3 text-sm"
              >
                <dt className="opacity-55">{key}</dt>
                <dd className="text-right">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-12 text-[19px] font-medium">Описание</h2>
          <p className="mt-4 max-w-[75ch] leading-relaxed opacity-75">{product.description}</p>

          {product.documents.length > 0 && (
            <>
              <h2 className="mt-12 text-[19px] font-medium">Документы</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {product.documents.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line-light bg-white p-4 text-sm transition-colors hover:border-accent"
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

          {/*
            Ключевой узел перелинковки: отсюда вес карточки уходит на
            страницы кузовов, а с них обратно на товары. Без этого блока
            5 808 карточек висели бы тупиками.
          */}
          {fits.length > 0 && (
            <>
              <h2 className="mt-12 text-[19px] font-medium">Подходит к автомобилям</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {fits.map((fit) => (
                  <CatalogTile
                    key={`${fit.brandSlug}-${fit.modelSlug}-${fit.variant.slug}`}
                    href={
                      fit.variant.hasOwnPage
                        ? urls.variant(fit.brandSlug, fit.modelSlug, fit.variant.slug)
                        : urls.model(fit.brandSlug, fit.modelSlug)
                    }
                    title={`${fit.brand} ${fit.model}`}
                    count={
                      formatVariantShort(
                        fit.variant.generation,
                        fit.variant.yearFrom,
                        fit.variant.yearTo,
                      ) || 'все годы'
                    }
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <aside className="h-fit rounded-[var(--radius-block)] border border-line-light bg-white p-7 lg:sticky lg:top-6">
          <div className="text-[13px] opacity-55">
            {product.manufacturer}
            {product.country ? ` · ${product.country}` : ''} · артикул {product.article}
          </div>

          {/* Цена — Wix Madefor 22/600, не Unbounded: см. docs/typography.md */}
          <div className="mt-4 text-[22px] font-semibold">{formatPrice(product.price)}</div>

          <div
            className={`mt-4 inline-block rounded px-2 py-1 text-xs font-semibold ${
              product.inStock ? 'bg-in-stock/12 text-in-stock' : 'bg-on-order/12 text-on-order'
            }`}
          >
            {product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
          </div>

          {/*
            Переключатель получения стоит до кнопки, а не после: от него
            зависит и срок, и итоговая сумма, и человек должен выбрать
            раньше, чем нажмёт.
          */}
          <Tabs
            name="poluchenie-tovara"
            tone="light"
            className="mt-6"
            tabs={[
              {
                label: 'Забрать в СПб',
                content: (
                  <div className="text-sm opacity-70">
                    <p>Санкт-Петербург, Софийская ул. 72</p>
                    <p className="mt-2">Установка за 3 часа, без записи в приёмные часы</p>
                  </div>
                ),
              },
              {
                label: 'Доставка СДЭК',
                content: (
                  <div className="text-sm opacity-70">
                    <p>1 100 городов, до двери или в пункт выдачи</p>
                    <p className="mt-2">Срок в пути 1–7 дней, с отслеживанием</p>
                  </div>
                ),
              },
            ]}
          />

          <button
            type="button"
            className="mt-7 w-full rounded-[10px] bg-accent px-4 py-3 font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Узнать цену
          </button>
          <Link
            href="/zapis"
            className="mt-3 block w-full rounded-[10px] border border-line-light px-4 py-3 text-center transition-colors hover:border-accent"
          >
            Записаться на установку
          </Link>

          <a
            href="tel:+78121234567"
            className="mt-7 block text-[19px] font-semibold hover:text-accent"
          >
            +7 (812) 123-45-67
          </a>
          <p className="mt-2 text-xs opacity-50">Гарантия 2 года · документы для ТО</p>
        </aside>
      </div>
    </CatalogShell>
  )
}
