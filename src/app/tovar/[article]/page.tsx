import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { formatNumber, formatPrice, formatVariantLabel, formatVariantShort } from '@/catalog/format'
import {
  getProduct,
  listAllProductSlugs,
  listSimilarProducts,
  listVariantsForProduct,
} from '@/catalog/queries'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { OrderPanel } from '@/components/product/order-panel'
import { CONTACTS } from '@/content/contacts'
import { getDb } from '@/db/client'
import { limitParams } from '@/catalog/build-scope'

interface Params {
  params: Promise<{ article: string }>
}

export async function generateStaticParams() {
  const db = await getDb()
  const slugs = await listAllProductSlugs(db)
  return limitParams(slugs.map((article) => ({ article })), '/tovar/[article]')
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
  const [fits, similar] = await Promise.all([
    listVariantsForProduct(db, articleSlug),
    listSimilarProducts(db, articleSlug),
  ])
  return { product, fits, similar }
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

  const { product, fits, similar } = data
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

  const heading = 'text-[19px] font-medium'
  const thumbs = product.images.slice(1, 6)

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
      titleFont="body"
    >
      <div className="flex flex-col items-start gap-8 lg:flex-row">
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/*
            Тёмная подложка под снимком не для красоты: фаркопы снимают
            на светлом фоне и с прозрачностью по краям, и на белом они
            растворяются — не видно, где кончается деталь.
          */}
          <div className="relative h-[440px] overflow-hidden rounded-[14px] bg-[#141416]">
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

          {thumbs.length > 0 && (
            <div className="grid grid-cols-5 gap-2.5">
              {thumbs.map((src) => (
                <div key={src} className="h-[92px] overflow-hidden rounded-[9px] bg-[#141416]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-contain" />
                </div>
              ))}
            </div>
          )}
        </div>

        <OrderPanel
          manufacturer={product.manufacturer}
          country={product.country}
          article={product.article}
          price={formatPrice(product.price)}
          inStock={product.inStock}
          stockText={product.deliveryText ?? (product.inStock ? 'в наличии' : 'под заказ')}
        />
      </div>

      <section className="flex max-w-[760px] flex-col gap-3.5">
        <h2 className={heading}>Характеристики</h2>
        <dl className="flex flex-col">
          {specs.map(([key, value]) => (
            <div
              key={key}
              className="grid grid-cols-2 gap-6 border-b border-ink-dark/8 py-3 text-sm"
            >
              <dt className="text-[#6E6E6C]">{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="flex max-w-[760px] flex-col gap-2.5">
        <h2 className={heading}>Описание</h2>
        <p className="text-[15px] leading-[1.7] text-[#4A4A4C]">{product.description}</p>
      </section>

      {product.documents.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={heading}>Документы</h2>
          <div className="grid max-w-[760px] gap-3 sm:grid-cols-2">
            {product.documents.map((doc) => (
              <a
                key={doc.url}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-xl border border-ink-dark/14 px-[22px] py-5 transition-colors hover:border-accent hover:bg-accent-soft"
              >
                <span className="shrink-0 rounded-md bg-accent px-[11px] py-2 text-[11px] font-bold tracking-[0.04em] text-[#FFF6F4]">
                  PDF
                </span>
                <span className="flex flex-col gap-[3px]">
                  <span className="text-[15px] font-medium">{doc.label}</span>
                  <span className="text-xs text-[#8A8A88]">PDF</span>
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {/*
        Ключевой узел перелинковки: отсюда вес карточки уходит на
        страницы кузовов, а с них обратно на товары. Без этого блока
        5 808 карточек висели бы тупиками.
      */}
      {fits.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={heading}>Подходит к автомобилям</h2>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {fits.map((fit) => (
              <Link
                key={`${fit.brandSlug}-${fit.modelSlug}-${fit.variant.slug}`}
                href={
                  fit.variant.hasOwnPage
                    ? urls.variant(fit.brandSlug, fit.modelSlug, fit.variant.slug)
                    : urls.model(fit.brandSlug, fit.modelSlug)
                }
                className="flex flex-col gap-1 rounded-[10px] border border-ink-dark/12 px-[18px] py-4 transition-colors hover:border-ink-dark"
              >
                <span className="text-sm font-medium">
                  {fit.brand} {fit.model}
                </span>
                <span className="text-xs text-[#8A8A88]">
                  {formatVariantShort(
                    fit.variant.generation,
                    fit.variant.yearFrom,
                    fit.variant.yearTo,
                  ) || 'все годы'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col gap-2.5 rounded-[14px] bg-[#F2F1EF] p-6">
          <h2 className={heading}>Установка в Петербурге</h2>
          <p className="text-sm leading-[1.5] text-[#6E6E6C]">
            3 часа работы, гарантия 2 года, документы для ТО. {CONTACTS.address}.
          </p>
          <Link href="/ustanovka-farkopa" className="mt-1 text-sm text-accent hover:underline">
            Цены на установку →
          </Link>
        </div>
        <div className="flex flex-col gap-2.5 rounded-[14px] bg-[#F2F1EF] p-6">
          <h2 className={heading}>Доставка по России</h2>
          <p className="text-sm leading-[1.5] text-[#6E6E6C]">
            СДЭК в 1 100 городов, до двери или в пункт выдачи, с отслеживанием.
          </p>
          <Link href="/dostavka" className="mt-1 text-sm text-accent hover:underline">
            Рассчитать доставку →
          </Link>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className={heading}>Похожие товары</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((item) => (
              <Link
                key={item.slug}
                href={urls.product(item.slug)}
                className="flex flex-col gap-2.5 rounded-xl border border-ink-dark/10 p-3.5 transition-colors hover:border-ink-dark/28"
              >
                <div className="h-[130px] overflow-hidden rounded-[9px] bg-[#141416]">
                  {item.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.images[0]}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-contain"
                    />
                  ) : null}
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-medium">{item.article}</span>
                  <span className="text-[11px] text-[#8A8A88]">{item.manufacturer}</span>
                </div>
                <span className="text-[18px] font-semibold text-accent">
                  {formatPrice(item.price)}
                </span>
                <span
                  className={`self-start rounded-md px-2 py-1 text-[11px] font-semibold ${
                    item.inStock ? 'bg-in-stock/12 text-in-stock' : 'bg-on-order/12 text-on-order'
                  }`}
                >
                  {item.deliveryText ?? (item.inStock ? 'в наличии' : 'под заказ')}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </CatalogShell>
  )
}
