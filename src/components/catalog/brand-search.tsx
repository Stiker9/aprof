'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useDeferredValue, useMemo, useRef, useState } from 'react'
import { formatCount } from '@/catalog/format'
import { logoFor } from '@/catalog/logos'
import type { BrandRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'

/**
 * Поиск по маркам вместе с алфавитным указателем и сеткой.
 *
 * Указатель и сетка живут здесь, а не рядом на странице, потому что оба
 * зависят от запроса: сетка сужается, а буквы, за которыми ничего не
 * осталось, гаснут. Разнеси их — состояние пришлось бы поднимать в
 * страницу, а она серверная.
 *
 * Пока поле пустое, разметка ровно та же, что была до поиска: все 106
 * марок в HTML. Это важно не для вида, а для обхода — страница остаётся
 * узлом перелинковки на 106 марок, и фильтр на клиенте его не рушит.
 *
 * Совпадение ищется и по названию, и по адресу марки: «land rover»,
 * «land-rover» и «landrover» должны находить одно и то же. Плюс
 * кириллица: в каталоге марки записаны латиницей, а набирают их часто
 * по-русски — без этого «мерседес» не находил бы ничего.
 */

/*
  Кириллические написания марок. Список закрытый и короткий намеренно:
  сюда попали только те, которые в русской речи звучат иначе, чем
  пишутся латиницей. Транслитерация «в лоб» тут не работает — «Hyundai»
  по буквам даёт «хюндай», а ищут «хендай».
*/
const ALIASES: Record<string, string> = {
  audi: 'ауди',
  bmw: 'бмв бэха',
  byd: 'бид',
  chery: 'чери черри',
  chevrolet: 'шевроле шеви',
  citroen: 'ситроен',
  daewoo: 'дэу',
  datsun: 'датсун',
  dodge: 'додж',
  exeed: 'эксид',
  fiat: 'фиат',
  ford: 'форд',
  geely: 'джили',
  genesis: 'генезис',
  gac: 'гак',
  great_wall: 'грейт волл',
  haval: 'хавал хавейл',
  honda: 'хонда',
  hyundai: 'хендай хёндай хундай',
  infiniti: 'инфинити',
  jaguar: 'ягуар',
  jeep: 'джип',
  jetour: 'джетур',
  kia: 'киа кия',
  lada: 'лада ваз',
  'land-rover': 'ленд ровер лендровер',
  lexus: 'лексус',
  lifan: 'лифан',
  mazda: 'мазда',
  mercedes: 'мерседес мерс',
  mitsubishi: 'мицубиси митсубиси',
  nissan: 'ниссан нисан',
  omoda: 'омода',
  opel: 'опель',
  peugeot: 'пежо',
  porsche: 'порше',
  renault: 'рено',
  seat: 'сеат',
  skoda: 'шкода',
  subaru: 'субару',
  suzuki: 'сузуки судзуки',
  tank: 'танк',
  toyota: 'тойота',
  volkswagen: 'фольксваген вольксваген вw',
  volvo: 'вольво',
  uaz: 'уаз',
  gaz: 'газ',
}

/** Убирает всё, что человек может набрать иначе: регистр, дефисы, пробелы. */
const squash = (value: string) => value.toLowerCase().replace(/[\s_-]+/g, '')

export function BrandSearch({ brands }: { brands: BrandRow[] }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  /*
    Ввод отделён от отрисовки: перебор 106 марок с логотипами на каждое
    нажатие заметно дёргает поле на слабой машине. useDeferredValue
    оставляет ввод отзывчивым, а список догоняет.
  */
  const deferred = useDeferredValue(query)
  const trimmed = deferred.trim()

  // Поисковая строка каждой марки готовится один раз, а не на каждый ввод
  const haystacks = useMemo(
    () =>
      brands.map((brand) =>
        squash(`${brand.name} ${brand.slug} ${ALIASES[brand.slug] ?? ''}`),
      ),
    [brands],
  )

  const shown = useMemo(() => {
    if (!trimmed) return brands
    const needle = squash(trimmed)
    return brands.filter((_, index) => haystacks[index].includes(needle))
  }, [brands, haystacks, trimmed])

  const letters = useMemo(
    () =>
      [...new Set(brands.map((brand) => brand.name[0].toUpperCase()))].sort((a, b) =>
        a.localeCompare(b, 'ru'),
      ),
    [brands],
  )

  // Буквы, за которыми после фильтра ничего не осталось, гасим
  const liveLetters = useMemo(
    () => new Set(shown.map((brand) => brand.name[0].toUpperCase())),
    [shown],
  )

  // Найденное, разложенное по первой букве
  const groups = useMemo(() => {
    const map = new Map<string, BrandRow[]>()
    for (const brand of shown) {
      const letter = brand.name[0].toUpperCase()
      map.set(letter, [...(map.get(letter) ?? []), brand])
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, 'ru'))
  }, [shown])

  // Двенадцать самых наполненных марок
  const popular = useMemo(
    () => [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 12),
    [brands],
  )

  const searching = trimmed.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="relative flex min-w-[260px] flex-1 items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[18px] text-[15px] text-[#444442]"
          >
            ⌕
          </span>

          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setQuery('')
            }}
            placeholder="Найти марку — Toyota, Kia, мерседес"
            aria-label="Поиск по маркам"
            /*
              Ободок ведёт себя как у полей подбора: серый в покое,
              красный под курсором и в фокусе. Обводку браузера снимаем
              не молча — вместо неё тот же красный ободок, только толще,
              иначе поле пропадёт для тех, кто ходит с клавиатуры.

              appearance-none снимает родной крестик у type="search":
              он рисуется по-своему в каждом браузере и не совпадает ни
              с одной нашей иконкой.
            */
            className="h-[52px] w-full appearance-none rounded-xl border border-line-light bg-white pl-11 pr-11 text-[15px] text-ink-dark outline-none transition-colors placeholder:text-[#444442] hover:border-ink-dark/25 focus:border-accent focus:ring-2 focus:ring-accent/25 [&::-webkit-search-cancel-button]:hidden"
          />

          {searching ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Очистить поиск"
              className="absolute right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-[#444442] transition-colors hover:bg-paper-2 hover:text-ink-dark"
            >
              <span aria-hidden>×</span>
            </button>
          ) : null}
        </div>

        {/*
          Счётчик найденного объявляется вслух: человек, который не видит
          сетку, иначе не узнает, что список сузился.
        */}
        <p aria-live="polite" className="text-sm text-[#444442]">
          {searching
            ? shown.length > 0
              ? `Нашлось ${formatCount(shown.length, 'марка', 'марки', 'марок')}`
              : 'Ничего не нашлось'
            : `${formatCount(brands.length, 'марка', 'марки', 'марок')} в каталоге`}
        </p>
      </div>

      {/*
        Указатель нужен, пока список просматривают целиком. Во время
        поиска он теряет смысл — но не убираем его совсем: исчезающий
        блок дёргает страницу. Буквы без совпадений просто гаснут.
      */}
      <nav
        aria-label="Марки по алфавиту"
        className="flex flex-wrap items-center gap-1 border-y border-ink-dark/10 py-3.5"
      >
        {letters.map((letter) => {
          const alive = liveLetters.has(letter)
          return (
            <a
              key={letter}
              href={`#letter-${letter}`}
              aria-disabled={!alive}
              onClick={(event) => {
                if (!alive) event.preventDefault()
              }}
              className={`flex h-8 w-8 items-center justify-center rounded text-sm font-medium transition-colors ${
                alive
                  ? 'text-ink-dark hover:bg-paper-2'
                  : 'cursor-default text-ink-dark/20'
              }`}
            >
              {letter}
            </a>
          )
        })}
      </nav>

      {/*
        Популярные марки — крупными карточками сверху, как на главной:
        к ним приходит большинство, и искать Toyota в алфавите незачем.
        Во время поиска блок прячется: результаты и так одни, а две
        выдачи подряд путали бы.
      */}
      {!searching ? (
        <section aria-labelledby="popular-brands" className="flex flex-col gap-4">
          <h2 id="popular-brands" className="text-[19px] font-medium">
            Популярные марки
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {popular.map((brand) => (
              <BrandCard key={brand.slug} brand={brand} size="large" />
            ))}
          </div>
        </section>
      ) : null}

      {shown.length > 0 ? (
        /*
          Все марки — по буквам, как в справочниках: крупная буква слева,
          марки на неё справа. Из ста с лишним названий так находят своё
          глазами быстрее, чем в сплошной сетке, а указатель над списком
          ведёт прямо к нужной букве.
        */
        <section aria-label="Все марки по алфавиту" className="flex flex-col">
          {groups.map(([letter, items]) => (
            <div
              key={letter}
              id={searching ? undefined : `letter-${letter}`}
              className="grid scroll-mt-40 grid-cols-[48px_1fr] gap-x-4 border-t border-ink-dark/8 py-6 sm:grid-cols-[72px_1fr] sm:gap-x-6"
            >
              <span
                aria-hidden
                className="font-[family-name:var(--font-display)] text-[30px] leading-none text-ink-dark/25 sm:text-[40px]"
              >
                {letter}
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((brand) => (
                  <BrandCard key={brand.slug} brand={brand} size="small" />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        /*
          Пустой результат не тупик: под каталогом уже стоит блок «Не
          нашли свою марку» с телефоном, и отсюда ведём прямо в него,
          вместо того чтобы повторять телефон второй раз на странице.
        */
        <div className="flex flex-col items-start gap-3 rounded-[var(--radius-card)] border border-line-light bg-paper-3 px-7 py-8">
          <p className="text-[17px] text-ink-dark">
            По запросу «{trimmed}» марок нет.
          </p>
          <p className="max-w-[52ch] text-sm leading-[1.6] text-[#444442]">
            Проверьте написание или сбросьте поиск. Редкие и старые марки в каталог не выведены,
            но фаркоп под них обычно находится.
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              className="cursor-pointer rounded-lg border border-ink-dark/15 px-5 py-2.5 text-sm font-medium transition-colors hover:border-ink-dark"
            >
              Показать все марки
            </button>
            <a href="#ne-nashli" className="text-sm text-accent hover:underline">
              Подобрать по звонку →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Карточка марки: логотип слева, название и число фаркопов справа.
 *
 * Логотипы в родном цвете — так попросил заказчик, по цвету марку
 * узнают быстрее. У кого логотипа нет, вместо него кружок с первой
 * буквой: плитка не выглядит сломанной и стоит вровень с соседями.
 */
function BrandCard({ brand, size }: { brand: BrandRow; size: 'large' | 'small' }) {
  const logo = logoFor(brand.slug)
  const large = size === 'large'
  return (
    <Link
      href={urls.brand(brand.slug)}
      className={`group flex items-center gap-4 rounded-xl border border-line-light bg-white transition-[border-color,box-shadow] hover:border-ink-dark/20 hover:shadow-[0_8px_24px_rgba(20,20,22,0.06)] ${
        large ? 'min-h-[88px] px-5 py-4' : 'min-h-[64px] px-4 py-3'
      }`}
    >
      <span
        className={`relative flex shrink-0 items-center justify-center ${large ? 'h-12 w-16' : 'h-9 w-12'}`}
      >
        {logo ? (
          <Image src={logo} alt="" fill sizes={large ? '64px' : '48px'} className="object-contain" />
        ) : (
          <span
            aria-hidden
            className={`flex items-center justify-center rounded-full bg-paper-2 font-medium text-ink-dark/60 ${
              large ? 'h-11 w-11 text-[17px]' : 'h-8 w-8 text-[13px]'
            }`}
          >
            {brand.name[0].toUpperCase()}
          </span>
        )}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={`truncate font-medium text-ink-dark transition-colors group-hover:text-accent ${
            large ? 'text-[17px]' : 'text-[15px]'
          }`}
        >
          {brand.name}
        </span>
        <span className="text-[12px] text-[#555553]">
          {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
        </span>
      </span>
      <span
        aria-hidden
        className="text-[15px] text-ink-dark/30 transition-[color,transform] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
      >
        ↗
      </span>
    </Link>
  )
}
