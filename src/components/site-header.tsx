'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState, type MouseEvent } from 'react'
import { urls } from '@/catalog/urls'
import { CONTACTS } from '@/content/contacts'
import { useScrolled } from '@/components/use-scrolled'

/*
  «Подбор» и «Каталог» — разные страницы, потому что отвечают на разные
  вопросы. Каталог: «что есть на мою машину» — марка, модель, поколение.
  Подбор: «что есть с такими свойствами» — тип шара, нагрузка, цена,
  наличие; марка там ни при чём.

  Сначала оба пункта вели на один адрес, потом на разные якоря одной
  страницы — заказчик оба раза говорил, что разницы не видит. Он был
  прав: пока за пунктами стояло одно и то же содержимое, разводить их
  было нечем.
*/
const NAV = [
  { label: 'Подбор', href: '/podbor' },
  { label: 'Каталог', href: urls.catalog() },
  { label: 'Установка', href: '/ustanovka-farkopa' },
  { label: 'Услуги', href: '/uslugi' },
  { label: 'Акции', href: '/akcii' },
  { label: 'Контакты', href: '/kontakty' },
]

/** Быстрые действия в меню — три вещи, ради которых сюда заходят. */
const ACTIONS = [
  { num: '01', label: 'Подобрать фаркоп', href: '/podbor' },
  { num: '02', label: 'Записаться на установку', href: '/zapis' },
  { num: '03', label: 'Рассчитать доставку', href: '/dostavka' },
]

const COLUMNS = [
  {
    head: 'Каталог и услуги',
    links: [
      { label: 'Подбор по параметрам', href: '/podbor' },
      { label: 'Каталог по маркам', href: urls.catalog() },
      { label: 'Электрика и розетка', href: '/uslugi#elektrika' },
      { label: 'Подбор и консультация', href: '/uslugi#podbor' },
    ],
  },
  {
    head: 'О компании',
    links: [
      { label: 'О нас', href: '/o-nas' },
      { label: 'Наши работы', href: '/nashi-raboty' },
      { label: 'Отзывы', href: '/otzyvy' },
      { label: 'Акции', href: '/akcii' },
      { label: 'Блог', href: '/blog' },
    ],
  },
  {
    head: 'Покупателю',
    links: [
      { label: 'Доставка и оплата', href: '/dostavka' },
      { label: 'Гарантия', href: '/garantiya' },
      { label: 'Контакты', href: '/kontakty' },
      { label: 'Частые вопросы', href: '/ustanovka-farkopa' },
    ],
  },
]

const EASE = 'cubic-bezier(.16,1,.3,1)'

/*
  Раскрытие меню. Ширина и скругление отсюда убраны вместе с пилюлей:
  у полосы во всю ширину меняется только высота панели под ней.
*/
const SHELL_TRANSITION = `height 620ms ${EASE}, border-top-width 200ms ease`

/**
 * Появление строки меню.
 *
 * Строки не возникают разом, а выплывают по очереди с задержкой и
 * лёгким размытием. Задержки взяты из исходника макета: карточки
 * действий с 300 мс через 70, ссылки столбцов с 430 через 50 —
 * порядок появления повторяет порядок чтения.
 *
 * При закрытии задержек нет: меню должно исчезать сразу, а не
 * досматриваться в обратном порядке.
 */
function reveal(open: boolean, delay: number, distance: number) {
  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateY(0)' : `translateY(${distance}px)`,
    filter: open ? 'blur(0px)' : 'blur(6px)',
    transition: `opacity 620ms ease ${open ? delay : 0}ms, transform 900ms ${EASE} ${
      open ? delay : 0
    }ms, filter 620ms ease ${open ? delay : 0}ms`,
    pointerEvents: open ? ('auto' as const) : ('none' as const),
  }
}

/**
 * Шапка сайта — полоса во всю ширину, липнет к верху окна.
 *
 * Раньше это была плавающая пилюля: она висела поверх первого экрана,
 * на прокрутке сжималась до 660 пикселей и меняла скругление. Заказчику
 * такой вид не подошёл, и вместе с «оконной» вёрсткой страницы пилюля
 * ушла — теперь обычная полоса в потоке, как на большинстве сайтов.
 *
 * Из этого следуют две вещи. Строка состояний больше не нужна: она
 * была одна и та же коробка в трёх размерах, а у полосы размер один.
 * И меню раскрывается панелью под полосой, а не растягиванием самой
 * шапки — растягивать теперь нечего.
 *
 * Фон полосы непрозрачный. У пилюли он был полупрозрачным со стеклом,
 * потому что под ней проходила фотография; под полосой в потоке ничего
 * не проходит, и стекло превратилось бы в серую муть.
 */
export function SiteHeader() {
  /*
    Признак прокрутки берётся из общего хука, а не считается здесь: на
    него же опирается строка подбора, и от одного источника они ужимаются
    вместе. Пока признак жил внутри шапки, подбор о нём не знал, и между
    ними открывалась полоса.
  */
  const scrolled = useScrolled()
  const [open, setOpen] = useState(false)

  // Прокрутка закрывает меню: держать его раскрытым над уезжающей
  // страницей незачем, а закрывать вручную — лишнее действие.
  useEffect(() => {
    if (scrolled) setOpen(false)
  }, [scrolled])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  /*
    Логотип всегда ведёт на главную. Если мы уже на ней, переход
    никуда не ведёт — поэтому там он вместо перехода поднимает
    страницу к первому экрану. Это и ожидают от названия в шапке.
  */
  const onHome = usePathname() === urls.home()

  const scrollTopOnHome = (event: MouseEvent) => {
    if (!onHome) return
    event.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setOpen(false)
  }

  const burger =
    'absolute left-px h-[1.5px] w-[21px] rounded-sm bg-ink transition-[transform,top] duration-[620ms]'
  const burgerStyle = (rotate: string, top: string) => ({
    top,
    transform: rotate,
    transitionTimingFunction: EASE,
  })

  return (
    /*
      Обёртка нулевой высоты — шапка не занимает места в потоке и лежит
      поверх того, что идёт следом. Так фотография первого экрана
      доходит до верхнего края окна и просвечивает сквозь стекло.

      Сначала при переходе на классическую вёрстку шапка встала в поток
      обычной полосой, и стекло пропало: под полосой в потоке ничего не
      проходит, размывать ей было нечего. Заказчик это заметил сразу.
      Ширина во всю страницу осталась — от пилюли отказались, а вот
      наложение вернули.
    */
    <div className="sticky top-0 z-40 h-0">
    <header
      className="border-b backdrop-blur-[26px] backdrop-saturate-[1.35]"
      style={{
        /*
          Прокрученная страница уводит фотографию из-под шапки, и
          прозрачной ей больше не на чем держаться — фон уплотняется.
          Раскрытое меню тоже: сквозь него читать ссылки нельзя.
        */
        background: open
          ? 'rgba(14,14,16,.94)'
          : scrolled
            ? 'rgba(16,16,20,.88)'
            : 'rgba(18,18,20,.44)',
        borderColor: scrolled || open ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.08)',
        boxShadow: scrolled && !open ? '0 8px 24px rgba(0,0,0,.28)' : 'none',
        transition: 'background 420ms ease, border-color 300ms ease, box-shadow 300ms ease',
      }}
    >
      {/*
        Прокрученная страница ужимает шапку. Приём с farkop.ru: там при
        прокрутке сплющивается служебная полоска с городом и телефоном,
        а основная строка с логотипом и меню остаётся прежней высоты —
        уходит второстепенное, главное на месте.

        У нас ярус один, и второстепенное в нём — подпись с часами
        работы под телефоном. Она прячется, и шапка садится на её
        высоту: с 72 до 56 пикселей. Переход плавный, 300 мс, как и у
        них — резкий скачок при прокрутке дёргает глаз.
      */}
      <div
        className="relative flex items-center gap-7 px-5 sm:px-8 lg:px-14"
        style={{
          height: scrolled && !open ? 'var(--header-h-min)' : 'var(--header-h)',
          transition: 'height 300ms ease',
        }}
      >
        {/*
          Боковые группы обе на flex-1, меню между ними — shrink-0.
          Это и есть центровка: свободное место делится поровну, и
          середина меню совпадает с серединой полосы независимо от того,
          что группы разной ширины (слева бургер с названием, справа
          поиск с телефоном).
        */}
        <div className="flex flex-1 items-center gap-7">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Закрыть меню' : 'Меню'}
          aria-expanded={open}
          className="relative block h-6 w-6 shrink-0"
        >
          <span
            className={burger}
            style={burgerStyle(open ? 'rotate(45deg)' : 'rotate(0deg)', open ? '12px' : '8px')}
          />
          <span
            className={burger}
            style={burgerStyle(open ? 'rotate(-45deg)' : 'rotate(0deg)', open ? '12px' : '16px')}
          />
        </button>

        <Link
          href={urls.home()}
          onClick={scrollTopOnHome}
          className="shrink-0 font-[family-name:var(--font-display)] text-[15px] tracking-[0.24em] text-ink"
        >
          AUTOPROFI
        </Link>
        </div>

        {/*
          Меню по центру полосы. Раньше оно было прижато вправо и стояло
          вплотную к телефону — заказчик попросил симметрии.

          Центровка не флексом «между двумя соседями»: группы слева и
          справа разной ширины, и меню от середины экрана уезжало. Обе
          группы взяты на flex-1, меню shrink-0 — свободное место
          делится поровну, и середина сходится с серединой полосы.

          Просвет между пунктами на lg чуть уже: при 1024 пикселях меню
          с зазором 28 упиралось бы в телефон.
        */}
        <nav className="hidden shrink-0 items-center gap-5 lg:flex xl:gap-7">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="whitespace-nowrap text-sm text-ink transition-opacity hover:opacity-65"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-4">
          <Link
            href={urls.catalog()}
            aria-label="Поиск"
            className="hidden h-[34px] w-[34px] items-center justify-center rounded-full border border-white/22 text-sm text-ink transition-colors hover:border-white/50 sm:flex"
          >
            <span aria-hidden>⌕</span>
          </Link>
          <div className="flex flex-col items-end gap-px">
            <a
              href={CONTACTS.phoneHref}
              className="whitespace-nowrap text-[15px] font-semibold text-ink"
            >
              {CONTACTS.phone}
            </a>
            {/*
              Часы работы прячутся при прокрутке — это и есть то
              второстепенное, за счёт которого шапка садится. Убираем не
              display'ем, а высотой и прозрачностью: display рвёт переход,
              и строка исчезала бы рывком, пока шапка едет плавно.
            */}
            <span
              aria-hidden={scrolled && !open}
              className="block overflow-hidden whitespace-nowrap text-[11px] text-ink-muted"
              style={{
                maxHeight: scrolled && !open ? '0px' : '16px',
                opacity: scrolled && !open ? 0 : 1,
                transition: 'max-height 300ms ease, opacity 200ms ease',
              }}
            >
              {CONTACTS.hours}
            </span>
          </div>
        </div>
      </div>

      {/*
        Меню раскрывается панелью под полосой. Высота анимируется на
        обёртке, а не на содержимом: содержимое переменной длины, и
        анимировать его собственную высоту нечем.
      */}
      <div
        className="overflow-hidden border-white/10"
        style={{
          height: open ? 'var(--menu-open-height)' : '0px',
          borderTopWidth: open ? '1px' : '0px',
          transition: SHELL_TRANSITION,
        }}
      >
        <div
          className="flex h-full flex-col overflow-y-auto px-5 pt-5 text-ink sm:px-8 lg:px-14"
          aria-hidden={!open}
        >
          {/*
            Во всю ширину, без колонки в 1100 пикселей по центру: у
            пилюли содержимое было уже самой шапки, и колонка держала
            его собранным. Полоса идёт до краёв окна, и меню внутри неё
            выравнивается по тем же боковым отступам, что и секции.
          */}
          <div className="flex w-full flex-1 flex-col">
            <div className="grid gap-[18px] sm:grid-cols-3">
              {ACTIONS.map((action, index) => (
                <div key={action.num} style={reveal(open, 300 + index * 70, 18)}>
                  <Link
                    href={action.href}
                    onClick={() => setOpen(false)}
                    tabIndex={open ? undefined : -1}
                    className="flex flex-col gap-8 border-y border-white/30 px-1 pb-3.5 pt-5 transition-colors hover:border-white/60"
                  >
                    <span className="text-xs text-[#8D8D8B]">{action.num}</span>
                    <span className="text-base leading-[1.25]">{action.label}</span>
                  </Link>
                </div>
              ))}
            </div>

            <div className="mt-9 grid gap-8 sm:grid-cols-3">
              {COLUMNS.map((column) => (
                <div key={column.head} className="flex flex-col gap-0.5">
                  <div className="mb-2 text-xs uppercase tracking-[0.14em] text-[#75757A]">
                    {column.head}
                  </div>
                  {column.links.map((link, index) => (
                    <div key={link.label} style={reveal(open, 430 + index * 50, 20)}>
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        tabIndex={open ? undefined : -1}
                        className="inline-block text-[18px] leading-[1.7] tracking-[-0.01em] transition-opacity hover:opacity-65"
                      >
                        {link.label}
                      </Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div
              className="mt-auto flex items-end justify-between gap-6 border-t border-white/20 pb-5 pt-[18px] text-sm text-[#C6C6C3]"
              style={{
                opacity: open ? 1 : 0,
                transform: open ? 'translateY(0)' : 'translateY(14px)',
                transition: open
                  ? `opacity 600ms ease 800ms, transform 800ms ${EASE} 800ms`
                  : 'opacity 260ms ease, transform 260ms ease',
              }}
            >
              <div className="flex flex-col gap-1">
                <span>
                  {CONTACTS.phone} · {CONTACTS.hours}
                </span>
                <span>{CONTACTS.address}</span>
              </div>
              <Link
                href="/politika-konfidencialnosti"
                onClick={() => setOpen(false)}
                tabIndex={open ? undefined : -1}
                className="whitespace-nowrap text-[13px] text-[#9C9C9A] underline"
              >
                Политика конфиденциальности
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
    </div>
  )
}
