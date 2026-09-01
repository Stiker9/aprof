'use client'

import { useEffect, useMemo, useState } from 'react'
import { formatCount, formatPrice } from '@/catalog/format'
import type { ProductRow } from '@/catalog/queries'
import { ProductCard } from '@/components/product-card'
import { Hint } from '@/components/ui/hint'
import { HINT_TOW, HINT_VERT } from '@/content/terms'
import { CarSelect, type CarChoice } from '@/components/catalog/car-select'
import type { PickerBrand } from '@/catalog/queries'

/**
 * Фильтр и сортировка над сеткой товаров.
 *
 * Один компонент на два места: страницы кузова и модели, где товары уже
 * пришли со страницей, и страница подбора, где их 5 808 и они грузятся
 * отдельным файлом. Раньше это были два почти одинаковых компонента,
 * и правку приходилось вносить дважды.
 *
 * Раскладка взята с farkop.ru по просьбе заказчика: подписи над полями
 * и сетка в три колонки вместо строки безымянных списков. Так видно,
 * что каждое поле делает, не открывая его.
 *
 * Два их решения не перенесены осознанно:
 *
 * 1. Кнопка «Показать N товаров». У них фильтр уходит на сервер, и без
 *    кнопки не обойтись. Наш считает на клиенте и обновляет список сразу
 *    — кнопка была бы лишним нажатием ни за чем. Число найденного при
 *    этом никуда не делось, оно над сеткой.
 *
 * 2. «Электрика в комплекте». Признак есть и у нас, но «в комплекте»
 *    стоит у двух товаров из 5 808 — фильтр, отсекающий каталог до двух
 *    штук, вреднее, чем его отсутствие.
 */

const PAGE = 48

type Sort = 'cheap' | 'expensive' | 'load'

const SORTS: { key: Sort; label: string }[] = [
  { key: 'cheap', label: 'Сначала дешёвые' },
  { key: 'expensive', label: 'Сначала дорогие' },
  { key: 'load', label: 'По тяговой нагрузке' },
]

/*
  Расшифровки взяты из описаний товаров, где они названы прямо. Коды,
  для которых расшифровки в данных нет (A, F и редкие), показываются как
  есть — придумывать им значение нельзя.
*/
const BALL_LABEL: Record<string, string> = {
  A: 'A — на болтах',
  C: 'C — горизонтальный съёмный',
  E: 'E — под американский квадрат',
  EA: 'EA — квадрат с антистуком',
  AV: 'AV — вертикальный на ключе',
  AH: 'AH — горизонтальный на ключе',
  H: 'H — сварной несъёмный',
}

const TOW_STEPS = [1000, 1500, 2000, 2500, 3000]
const VERT_STEPS = [50, 75, 100, 150]


const FIELD =
  'h-11 w-full rounded-[10px] border border-ink-dark/15 bg-white px-3.5 text-[14px] text-ink-dark outline-none transition-colors hover:border-ink-dark/35 focus:border-accent'
const LABEL = 'mb-1.5 block text-[12px] font-medium text-ink-muted'

/** Поле с подписью — как у них: видно назначение, не открывая список. */
function Field({
  label,
  hint,
  children,
}: {
  label: string
  /** Пояснение к термину, если он покупателю не очевиден. */
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className={`${LABEL} flex items-center gap-1.5`}>
        {label}
        {hint ? <Hint text={hint} /> : null}
      </span>
      {children}
    </label>
  )
}

export function ProductFilter({
  products,
  cars,
  fits,
}: {
  products: ProductRow[]
  /*
    Справочник машин и связки «кузов → товары». Есть только на странице
    подбора: там машину выбирают прямо в фильтре. На странице кузова
    машина уже выбрана заголовком, и повторять выбор незачем.
  */
  cars?: PickerBrand[]
  fits?: Record<string, number[]>
}) {
  const [car, setCar] = useState<CarChoice>({ brand: '', model: '', variant: '' })
  const [inStock, setInStock] = useState(false)
  const [noCut, setNoCut] = useState(false)
  const [ball, setBall] = useState('')
  const [maker, setMaker] = useState('')
  const [priceFrom, setPriceFrom] = useState('')
  const [priceTo, setPriceTo] = useState('')
  const [minTow, setMinTow] = useState('')
  const [minVert, setMinVert] = useState('')
  const [sort, setSort] = useState<Sort>('cheap')
  const [limit, setLimit] = useState(PAGE)

  /*
    Набор номеров товаров, подходящих выбранной машине. Пока поколение
    не выбрано, машина список не сужает: фаркоп подбирается по кузову и
    годам, и отбор по одной марке дал бы ложное совпадение.
  */
  const fitting = useMemo(() => {
    if (!fits || !car.brand || !car.model || !car.variant) return null
    return new Set(fits[`${car.brand}/${car.model}/${car.variant}`] ?? [])
  }, [fits, car])

  /*
    Отбор с возможностью выключить одно условие.

    `skip` нужен, чтобы собрать сами варианты для списков. Брать их из
    всего каталога нельзя: выбрав Lexus GX J120 с двадцатью восемью
    фаркопами, человек видел бы в списке типы, которых под его машину
    нет вовсе.

    Но и по полностью отфильтрованному списку тоже нельзя: выбрав тип
    шара, человек увидел бы в этом же списке только его — сменить выбор
    стало бы не на что. Поэтому для списка типов отключается фильтр по
    типу, для списка производителей — по производителю.
  */
  const select = useMemo(() => {
    const from = priceFrom ? Number(priceFrom) : null
    const to = priceTo ? Number(priceTo) : null
    const tow = minTow ? Number(minTow) : null
    const vert = minVert ? Number(minVert) : null

    return (skip?: 'ball' | 'maker') =>
      products.filter(
        (p, i) =>
          (fitting === null || fitting.has(i)) &&
          (!inStock || p.inStock) &&
          (!noCut || p.bumperCut === 'not_required') &&
          (skip === 'ball' || !ball || p.ballType === ball) &&
          (skip === 'maker' || !maker || p.manufacturer === maker) &&
          (from === null || p.price >= from) &&
          (to === null || p.price <= to) &&
          (tow === null || (p.towLoadKg ?? 0) >= tow) &&
          (vert === null || (p.verticalLoadKg ?? 0) >= vert),
      )
  }, [products, fitting, inStock, noCut, ball, maker, priceFrom, priceTo, minTow, minVert])

  /*
    Варианты собираются из самих товаров, а не задаются справочником:
    на Ладу Ларгус приходят одни производители, на Ауди другие.
    Варианты, за которыми ничего не осталось, не показываем вовсе —
    выбор, дающий пустой список, это тупик.

    Число товаров считается, но на экран не выводится: заказчик
    справедливо спросил, зачем оно покупателю. Тупиков оно не
    предотвращает — пустые варианты и так не показываются, — а сколько
    нашлось всего, видно под фильтром. Здесь оно осталось только для
    порядка: частые типы и производители идут первыми.
  */
  const balls = useMemo(() => {
    const seen = new Map<string, number>()
    for (const p of select('ball')) if (p.ballType) seen.set(p.ballType, (seen.get(p.ballType) ?? 0) + 1)
    return [...seen.entries()].sort((a, b) => b[1] - a[1])
  }, [select])

  const makers = useMemo(() => {
    const seen = new Map<string, number>()
    for (const p of select('maker')) seen.set(p.manufacturer, (seen.get(p.manufacturer) ?? 0) + 1)
    return [...seen.entries()].sort((a, b) => b[1] - a[1])
  }, [select])

  /* Границы цены — подсказка в полях «от» и «до», как у них */
  const bounds = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0 }
    let min = Infinity
    let max = 0
    for (const p of products) {
      if (p.price < min) min = p.price
      if (p.price > max) max = p.price
    }
    return { min, max }
  }, [products])

  const shown = useMemo(() => {
    const list = select()
    if (sort === 'expensive') return [...list].sort((a, b) => b.price - a.price)
    if (sort === 'load') return [...list].sort((a, b) => (b.towLoadKg ?? 0) - (a.towLoadKg ?? 0))
    return [...list].sort((a, b) => a.price - b.price)
  }, [select, sort])

  // Новый набор условий — показываем с начала, а не с прежней глубины
  useEffect(() => {
    setLimit(PAGE)
  }, [fitting, inStock, noCut, ball, maker, priceFrom, priceTo, minTow, minVert, sort])

  /*
    Выбор, который перестал существовать, снимаем. Выбрали тип шара, потом
    сузили по машине, и этого типа под неё не оказалось — в поле осталась
    бы пустая строка вместо названия, а список был бы пуст без видимой
    причины.
  */
  useEffect(() => {
    if (ball && !balls.some(([key]) => key === ball)) setBall('')
  }, [ball, balls])

  useEffect(() => {
    if (maker && !makers.some(([key]) => key === maker)) setMaker('')
  }, [maker, makers])

  const touched =
    car.brand !== '' || inStock || noCut || ball !== '' || maker !== '' || priceFrom !== '' ||
    priceTo !== '' || minTow !== '' || minVert !== ''

  const reset = () => {
    setCar({ brand: '', model: '', variant: '' })
    setInStock(false)
    setNoCut(false)
    setBall('')
    setMaker('')
    setPriceFrom('')
    setPriceTo('')
    setMinTow('')
    setMinVert('')
  }

  return (
    <div className="mt-8 flex flex-col gap-6">
      <div className="rounded-[var(--radius-card)] border border-line-light bg-paper-3 p-5 sm:p-6">
        <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {/*
            Машина первой строкой — как на референсе заказчика. На
            странице кузова её нет: там машина уже названа заголовком.
          */}
          {cars ? <CarSelect index={cars} value={car} onChange={setCar} /> : null}

          {balls.length > 1 ? (
            <Field label="Тип шара">
              <select value={ball} onChange={(e) => setBall(e.target.value)} className={FIELD}>
                <option value="">Любой</option>
                {balls.map(([key]) => (
                  <option key={key} value={key}>
                    {BALL_LABEL[key] ?? `Тип ${key}`}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="Вырез бампера">
            <select
              value={noCut ? 'no' : ''}
              onChange={(e) => setNoCut(e.target.value === 'no')}
              className={FIELD}
            >
              <option value="">Любой</option>
              <option value="no">Не требуется</option>
            </select>
          </Field>

          {makers.length > 1 ? (
            <Field label="Производитель">
              <select value={maker} onChange={(e) => setMaker(e.target.value)} className={FIELD}>
                <option value="">Любой</option>
                {makers.map(([key]) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {/*
            Цена — двумя полями «от» и «до», как у них, а не набором
            готовых порогов: пороги всегда мимо: кому-то нужно до 12, а
            в списке 10 и 15.
          */}
          <Field label="Цена, ₽">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={priceFrom}
                onChange={(e) => setPriceFrom(e.target.value)}
                placeholder={`от ${bounds.min}`}
                aria-label="Цена от"
                className={FIELD}
              />
              <input
                type="number"
                inputMode="numeric"
                value={priceTo}
                onChange={(e) => setPriceTo(e.target.value)}
                placeholder={`до ${bounds.max}`}
                aria-label="Цена до"
                className={FIELD}
              />
            </div>
          </Field>

          <Field label="Тяговая нагрузка, кг" hint={HINT_TOW}>
            <select value={minTow} onChange={(e) => setMinTow(e.target.value)} className={FIELD}>
              <option value="">Любая</option>
              {TOW_STEPS.map((kg) => (
                <option key={kg} value={kg}>
                  от {kg}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Вертикальная нагрузка, кг" hint={HINT_VERT}>
            <select value={minVert} onChange={(e) => setMinVert(e.target.value)} className={FIELD}>
              <option value="">Любая</option>
              {VERT_STEPS.map((kg) => (
                <option key={kg} value={kg}>
                  от {kg}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Наличие">
            <select
              value={inStock ? 'yes' : ''}
              onChange={(e) => setInStock(e.target.value === 'yes')}
              className={FIELD}
            >
              <option value="">Любое</option>
              <option value="yes">Только в наличии</option>
            </select>
          </Field>

          <Field label="Сортировка">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              className={FIELD}
            >
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {/*
          Счётчик объявляется вслух: человек, который не видит сетку,
          иначе не узнает, что список сузился.
        */}
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-ink-dark/10 pt-4 text-[14px]">
          <span aria-live="polite" className="font-medium">
            {shown.length === products.length
              ? formatCount(products.length, 'фаркоп', 'фаркопа', 'фаркопов')
              : `${formatCount(shown.length, 'фаркоп', 'фаркопа', 'фаркопов')} из ${products.length}`}
          </span>
          {shown.length > 0 ? (
            <span className="text-ink-muted">
              от {formatPrice(Math.min(...shown.map((p) => p.price)))} до{' '}
              {formatPrice(Math.max(...shown.map((p) => p.price)))}
            </span>
          ) : null}
          {touched ? (
            <button
              type="button"
              onClick={reset}
              className="ml-auto cursor-pointer text-accent underline-offset-2 hover:underline"
            >
              Сбросить ✕
            </button>
          ) : null}
        </div>
      </div>

      {shown.length > 0 ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shown.slice(0, limit).map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          {shown.length > limit ? (
            <button
              type="button"
              onClick={() => setLimit((v) => v + PAGE)}
              className="mx-auto cursor-pointer rounded-full border border-ink-dark/20 px-8 py-3.5 text-[15px] font-medium transition-colors hover:border-ink-dark"
            >
              Показать ещё · осталось {shown.length - limit}
            </button>
          ) : null}
        </>
      ) : (
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-line-light bg-white px-7 py-8">
          <p className="text-[17px]">Под эти условия ничего не подошло.</p>
          <p className="max-w-[52ch] text-sm leading-[1.6] text-ink-dim">
            Снимите часть условий — или позвоните, подскажем, что взять из того, что есть.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-1 cursor-pointer rounded-lg border border-ink-dark/15 px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink-dark"
          >
            Показать все
          </button>
        </div>
      )}
    </div>
  )
}
