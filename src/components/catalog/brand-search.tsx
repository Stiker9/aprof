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

  // Первая марка на каждую букву получает якорь — к ней ведёт указатель
  const seen = new Set<string>()
  const anchorOf = (brand: BrandRow) => {
    const letter = brand.name[0].toUpperCase()
    if (seen.has(letter)) return undefined
    seen.add(letter)
    return `letter-${letter}`
  }

  const searching = trimmed.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="relative flex min-w-[260px] flex-1 items-center">
          <span
            aria-hidden
            className="pointer-events-none absolute left-[18px] text-[15px] text-ink-muted"
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
            className="h-[52px] w-full appearance-none rounded-xl border border-line-light bg-white pl-11 pr-11 text-[15px] text-ink-dark outline-none transition-colors placeholder:text-ink-muted hover:border-ink-dark/25 focus:border-accent focus:ring-2 focus:ring-accent/25 [&::-webkit-search-cancel-button]:hidden"
          />

          {searching ? (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                inputRef.current?.focus()
              }}
              aria-label="Очистить поиск"
              className="absolute right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-lg leading-none text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink-dark"
            >
              <span aria-hidden>×</span>
            </button>
          ) : null}
        </div>

        {/*
          Счётчик найденного объявляется вслух: человек, который не видит
          сетку, иначе не узнает, что список сузился.
        */}
        <p aria-live="polite" className="text-sm text-ink-muted">
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

      {shown.length > 0 ? (
        /*
          Ячейки склеены в таблицу: зазор в один пиксель на общем фоне
          даёт сетку разделителей. Отдельными плитками с просветом, как
          на главной, здесь нельзя — там их две дюжины, а тут 106, и
          просветы рассыпают список на карточки вместо единого указателя.
        */
        <div className="grid grid-cols-2 gap-px border border-ink-dark/8 bg-ink-dark/8 sm:grid-cols-3 lg:grid-cols-6">
          {shown.map((brand) => {
            const logo = logoFor(brand.slug)
            return (
              <Link
                key={brand.slug}
                id={searching ? undefined : anchorOf(brand)}
                href={urls.brand(brand.slug)}
                className="flex scroll-mt-32 flex-col items-center justify-center gap-[7px] bg-white px-2.5 py-5 transition-colors hover:bg-paper-2"
              >
                {logo ? (
                  /*
                    Логотипы обесцвечены и притушены. В цвете сетка из ста
                    с лишним марок превращается в рябь: каждый бренд тянет
                    внимание своим красным или синим, и найти нужную марку
                    становится труднее, а не легче.
                  */
                  <span className="relative block h-8 w-[52px] brightness-[.55] grayscale">
                    <Image src={logo} alt="" fill sizes="52px" className="object-contain" />
                  </span>
                ) : null}

                <span className="text-center text-sm text-[#2E2E30]">{brand.name}</span>
                <span className="text-[11px] text-ink-muted">
                  {formatCount(brand.productCount, 'фаркоп', 'фаркопа', 'фаркопов')}
                </span>
              </Link>
            )
          })}
        </div>
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
          <p className="max-w-[52ch] text-sm leading-[1.6] text-ink-dim">
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
