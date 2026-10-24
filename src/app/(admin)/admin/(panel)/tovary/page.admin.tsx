import Link from 'next/link'
import { requireAdmin } from '@/admin/auth'
import {
  countAdminProducts,
  listAdminProducts,
  PAGE_SIZE,
  type AdminProduct,
} from '@/admin/products'
import { formatNumber, formatPrice, formatVariantShort, plural } from '@/catalog/format'
import { listBrands, listModels, listVariants } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import { CarFilter } from '@/components/admin/car-filter'
import { Editable } from '@/components/admin/editable'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { ProductPhotoUpload } from '@/components/admin/photo-upload'
import { Toggle } from '@/components/admin/toggle'
import { getDb } from '@/db/client'

/**
 * Товары: цены, описания, скрытие.
 *
 * ── Что здесь правится и что нет ──
 *
 * Правятся цена, артикул, описание и видимость. Не правятся остатки,
 * связки с машинами и характеристики: первое меняется у поставщика
 * ежедневно (3 454 позиции — вручную такое не ведут), второе и третье
 * приходит из выгрузки и описывает изделие, а не наше предложение.
 *
 * ── Почему рядом стоят две цены ──
 *
 * Левая — поставщика, правая — своя. Если своей нет, в поле серым
 * видно, какую покажет сайт. Без этой пары владелец не отличает «цена
 * из выгрузки» от «я поставил такую же», и при следующем обновлении
 * прайса не понимает, почему половина цен изменилась, а половина нет.
 *
 * ── Почему поиск, а не фильтры по марке ──
 *
 * Владелец приходит сюда с артикулом из счёта или с названием машины
 * от покупателя. Дерево «марка → модель → кузов» он прошёл бы в четыре
 * нажатия, поиск находит за одно. Поиск идёт и по описанию, в котором
 * марка и модель уже есть.
 */
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  await requireAdmin()

  const params = await searchParams
  const one = (name: string) => (typeof params[name] === 'string' ? (params[name] as string) : '')

  const query = one('q')
  const brand = one('brand')
  // Модель без марки и кузов без модели смысла не имеют: такой адрес
  // можно только собрать руками, и отбор по нему был бы бессмысленным.
  const model = brand ? one('model') : ''
  const variant = model ? one('variant') : ''

  const page = Math.max(1, Number(params.p) || 1)
  const scope = { brand, model, variant }

  const db = await getDb()
  const [total, rows, brandList, modelList, variantList] = await Promise.all([
    countAdminProducts(db, query, scope),
    listAdminProducts(db, { query, page, scope }),
    listBrands(db),
    brand ? listModels(db, brand) : Promise.resolve([]),
    brand && model ? listVariants(db, brand, model) : Promise.resolve([]),
  ])

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  /*
    Подпись выбранной машины словами. Нужна в двух местах: под
    заголовком и в пустой выдаче, где без неё непонятно, по какому
    именно отбору ничего не нашлось.
  */
  const carLabel = [
    brandList.find((b) => b.slug === brand)?.name,
    modelList.find((m) => m.slug === model)?.name,
    (() => {
      const found = variantList.find((v) => v.slug === variant)
      return found ? formatVariantShort(found.generation, found.yearFrom, found.yearTo) : null
    })(),
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <>
      <PageHead
        title="Товары"
        lead={
          query || carLabel
            ? `${carLabel ? `${carLabel}: ` : ''}найдено ${formatNumber(total)} ${plural(total, 'товар', 'товара', 'товаров')}`
            : `${formatNumber(total)} ${plural(total, 'товар', 'товара', 'товаров')} в каталоге`
        }
      >
        <CarFilter
          query={query}
          brand={brand}
          model={model}
          variant={variant}
          brands={brandList.map((b) => ({ value: b.slug, label: b.name, count: b.productCount }))}
          models={modelList.map((m) => ({ value: m.slug, label: m.name, count: m.productCount }))}
          variants={variantList.map((v) => ({
            value: v.slug,
            label: formatVariantShort(v.generation, v.yearFrom, v.yearTo) || v.name,
            count: v.productCount,
          }))}
        />
      </PageHead>

      <PageBody>
        {rows.length === 0 ? (
          <Empty title={carLabel ? `На ${carLabel} ничего не нашлось` : 'Ничего не нашлось'}>
            {carLabel && query
              ? 'Слово и машина отбираются вместе. Попробуйте убрать слово — возможно, на эту машину товар есть, но называется иначе.'
              : carLabel
                ? 'На этот кузов фаркопов в выгрузке нет. Попробуйте выбрать модель целиком, без кузова.'
                : 'Попробуйте часть артикула или название модели — поиск ищет и по описанию товара.'}
          </Empty>
        ) : (
          <>
            {/*
              Сетка, а не <table>. Таблица на телефоне не складывается:
              пять столбцов с полями ввода требуют 480 пикселей, и на
              экране в 375 они либо уезжают за край, либо сжимаются до
              нечитаемого. Сетка на узком экране раскладывает ту же
              строку в карточку, а на широком остаётся таблицей — и
              разметка при этом одна.
            */}
            <div className="overflow-hidden rounded-card border border-line-light bg-white">
              <div className={`${GRID} hidden border-b border-line-light bg-paper-2 px-3 py-2 text-[11px] tracking-wide text-ink-muted uppercase lg:grid`}>
                <span className="font-semibold">Товар</span>
                <span className="text-right font-semibold">У поставщика</span>
                <span className="font-semibold">Своя цена</span>
                <span className="font-semibold">Свой артикул</span>
                <span className="font-semibold">На сайте</span>
              </div>

              <div className="divide-y divide-line-light">
                {rows.map((row) => (
                  <Row key={row.slug} product={row} />
                ))}
              </div>
            </div>

            <Pager page={page} pages={pages} query={query} scope={scope} />
          </>
        )}
      </PageBody>
    </>
  )
}

/**
 * Раскладка строки товара.
 *
 * Пять колонок на широком экране, одна на узком. Вынесена в
 * константу, потому что по ней же строится шапка таблицы: разъедься
 * они — подписи столбцов встанут не над своими полями.
 */
const GRID = 'grid gap-x-3 gap-y-2 lg:grid-cols-[minmax(0,1fr)_7rem_8rem_11rem_7rem]'

function Row({ product }: { product: AdminProduct }) {
  const hidden = product.own.hidden === '1'

  // Что показывает карточка сейчас: своя фотография владельца, иначе
  // собранная парсером, иначе ничего — и тогда на сайте стоит
  // обобщённое изображение по типу шара.
  const own = product.own.photo ?? product.parsedPhoto ?? ''

  const changed = [
    product.own.photo ? 'фотография' : '',
    product.own.description ? 'описание' : '',
  ].filter(Boolean)

  return (
    <div className={`${GRID} px-3 py-3 lg:items-start ${hidden ? 'opacity-55' : ''}`}>
      <div className="min-w-0">
        <Link
          href={`/tovar/${product.slug}`}
          target="_blank"
          className="font-semibold hover:text-accent"
          title="Открыть карточку на сайте"
        >
          {product.article}
        </Link>
        <span className="block text-[12px] text-ink-muted">
          {product.manufacturer} · {product.description}
        </span>
        {/*
          Фотография и описание правятся здесь же, но свёрнутым блоком:
          владелец меняет их редко, а поле на три строки и загрузчик в
          каждой из пятидесяти строк превратили бы таблицу в простыню.
        */}
        <details className="mt-1">
          <summary className="w-fit cursor-pointer text-[12px] text-ink-dim hover:text-accent">
            {changed.length > 0 ? `Изменено: ${changed.join(' и ')}` : 'Фотография и описание'}
          </summary>

          <div className="mt-2 flex max-w-xl flex-col gap-3">
            <div>
              <span className="mb-1 block text-[11px] tracking-wide text-ink-dim uppercase">
                Фотография
              </span>
              <ProductPhotoUpload slug={product.slug} photo={own} />
              {/*
                Страница товара на этом же сервере — предпросмотр: правка
                видна сразу, а на vashfarkop.ru появится после публикации.
                Подпись говорит об этом прямо — иначе владелец ищет
                загруженное фото на сайте и не находит.
              */}
              <a
                href={urls.product(product.slug)}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-[12px] text-accent hover:underline"
              >
                Посмотреть, как будет на сайте ↗
              </a>
              <span className="ml-2 text-[11px] text-ink-dim">
                на vashfarkop.ru — после публикации
              </span>
              {!product.own.photo && product.parsedPhoto && (
                <p className="mt-1 text-[11px] text-ink-dim">
                  Сейчас показывается изображение с сайта завода. Своя заменит его.
                </p>
              )}
              {!product.own.photo && !product.parsedPhoto && (
                <p className="mt-1 text-[11px] text-ink-dim">
                  Своего изображения нет — на сайте стоит обобщённое фото по типу шара.
                </p>
              )}
            </div>

            <div>
              <span className="mb-1 block text-[11px] tracking-wide text-ink-dim uppercase">
                Описание
              </span>
              <Editable
                entity="product"
                targetKey={product.slug}
                field="description"
                value={product.own.description ?? ''}
                fallback={product.description}
                multiline
              />
            </div>
          </div>
        </details>
      </div>

      <div className="num flex items-baseline gap-2 whitespace-nowrap text-ink-muted lg:block lg:text-right">
        <Cap>У поставщика</Cap>
        <span>{formatPrice(product.sourcePrice)}</span>
        <span className="text-[11px] text-ink-dim lg:block">
          {product.inStock ? 'в наличии' : 'под заказ'}
        </span>
      </div>

      <div>
        <Cap>Своя цена</Cap>
        <Editable
          entity="product"
          targetKey={product.slug}
          field="price"
          value={product.own.price ?? ''}
          fallback={String(product.sourcePrice)}
          align="right"
          inputMode="numeric"
        />
      </div>

      <div>
        <Cap>Свой артикул</Cap>
        <Editable
          entity="product"
          targetKey={product.slug}
          field="article"
          value={product.own.article ?? ''}
          fallback={product.article}
        />
      </div>

      <div>
        <Toggle
          entity="product"
          targetKey={product.slug}
          field="hidden"
          on={hidden}
          label={hidden ? 'Скрыт' : 'Показан'}
          danger
        />
      </div>
    </div>
  )
}

/**
 * Подпись поля — только на узком экране.
 *
 * На широком её роль играет шапка таблицы. На телефоне шапки нет, и
 * без подписи два поля с числами подряд неразличимы: какое из них
 * цена поставщика, а какое своя.
 */
function Cap({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-0.5 block text-[11px] tracking-wide text-ink-dim uppercase lg:hidden">
      {children}
    </span>
  )
}

/**
 * Листалка.
 *
 * Номера страниц, а не «ещё 50»: владелец возвращается к тому же месту
 * после правки, и «страница 14» — единственный способ туда попасть.
 * Показываются только соседние номера — при 117 страницах полный
 * список занял бы больше места, чем таблица.
 */
function Pager({
  page,
  pages,
  query,
  scope,
}: {
  page: number
  pages: number
  query: string
  scope: { brand: string; model: string; variant: string }
}) {
  if (pages <= 1) return null

  // Выбор машины переносится на следующую страницу вместе со словом:
  // иначе со второй страницы отбор молча слетает на весь каталог.
  const href = (n: number) => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (scope.brand) params.set('brand', scope.brand)
    if (scope.model) params.set('model', scope.model)
    if (scope.variant) params.set('variant', scope.variant)
    if (n > 1) params.set('p', String(n))
    const search = params.toString()
    return search ? `/admin/tovary?${search}` : '/admin/tovary'
  }

  const numbers = new Set<number>([1, pages, page])
  for (const offset of [-2, -1, 1, 2]) {
    const n = page + offset
    if (n > 1 && n < pages) numbers.add(n)
  }
  const sorted = [...numbers].sort((a, b) => a - b)

  return (
    <nav className="mt-4 flex items-center justify-center gap-1 text-[13px]">
      {page > 1 && (
        <Link href={href(page - 1)} className="px-2 py-1 text-ink-muted hover:text-accent">
          ← назад
        </Link>
      )}

      {sorted.map((n, index) => (
        <span key={n} className="flex items-center gap-1">
          {index > 0 && sorted[index - 1] !== n - 1 && <span className="text-ink-dim">…</span>}
          <Link
            href={href(n)}
            className={`num min-w-8 rounded-lg px-2 py-1 text-center ${
              n === page
                ? 'bg-ink-dark font-semibold text-paper'
                : 'text-ink-muted hover:text-accent'
            }`}
          >
            {n}
          </Link>
        </span>
      ))}

      {page < pages && (
        <Link href={href(page + 1)} className="px-2 py-1 text-ink-muted hover:text-accent">
          вперёд →
        </Link>
      )}
    </nav>
  )
}
