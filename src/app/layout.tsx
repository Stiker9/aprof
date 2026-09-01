import type { Metadata } from 'next'
import localFont from 'next/font/local'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import './globals.css'

/**
 * Шрифты берутся из пакетов Fontsource и раздаются со своего домена.
 *
 * Подключать их через next/font/google нельзя: машина сборки не имеет
 * доступа к fonts.googleapis.com, сборка падает. Внешние CDN в этом
 * проекте не используются и по соображениям скорости — обращение
 * к чужому хосту задерживает первую отрисовку.
 *
 * Наборов обязательно два — кириллица И латиница. Долгое время был
 * подключён только кириллический файл, а цифр, латинских букв и знаков
 * препинания в нём нет: браузер брал их из системного шрифта, и в одной
 * строке оказывались два разных начертания. Заметно это было на числах —
 * «12 лет» и «2 года» на странице «О нас», где цифра и слово выглядели
 * набранными разными шрифтами, и в заголовке «С 2014 года».
 *
 * Расширенные наборы (cyrillic-ext, latin-ext, vietnamese) не берём:
 * это ещё четыре запроса ради символов, которых на сайте нет.
 */
const display = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  weight: '300 900',
})

const body = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-cyrillic-wght-normal.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  weight: '400 800',
})

export const metadata: Metadata = {
  title: 'Фаркопы с установкой в Санкт-Петербурге — AUTOPROFI',
  description:
    'Подберём фаркоп по марке, модели и году. Установка за один визит с документами для ТО, доставка по России.',
}

/**
 * Страница — сплошная стопка секций во всю ширину окна.
 *
 * Раньше было иначе: страница лежала на белом поле, каждая секция была
 * отдельной скруглённой плиткой, между плитками просвечивал фон. Так
 * задавал макет, но заказчику этот вид не подошёл — по краям оставались
 * поля, и сайт выглядел «окном в окне». Теперь классическая вёрстка:
 * ни полей, ни скруглений у секций, ни просветов между ними.
 *
 * Скругления остались там, где они по делу, — у карточек внутри секций.
 *
 * Шапка стоит в потоке отдельной строкой, а не лежит поверх первого
 * экрана. Поэтому высоты первых экранов считаются от `--header-h`.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full bg-white font-[family-name:var(--font-body)] text-ink">
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
