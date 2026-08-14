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
 */
const display = localFont({
  src: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2',
  variable: '--font-display',
  display: 'swap',
  weight: '300 900',
})

const body = localFont({
  src: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-cyrillic-wght-normal.woff2',
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
 * Страница лежит на белом поле с отступом в 6 пикселей и скруглена по
 * углам — так задано макетом. Скругление режет и шапку сверху, и подвал
 * снизу, поэтому обёртка одна на всё, а не по краям.
 *
 * `overflow-hidden` здесь обязателен: без него скругление не обрежет
 * тёмный фон шапки и подвала, и углы останутся квадратными.
 */
export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full bg-white p-1.5 font-[family-name:var(--font-body)] text-ink">
        {/*
          Шапка вынута из потока и лежит поверх содержимого. Это не
          украшательство: в макете фотография первого экрана уходит под
          шапку, и та размывает её собой. Если шапка занимает свою
          строку, размывать ей нечего — стекло превращается в обычную
          серую полосу, и первый экран перестаёт быть похож на макет.

          Страницы сами отступают сверху на высоту шапки: первый экран
          заводит фотографию под неё, остальные просто сдвигают контент.
        */}
        <div className="relative flex min-h-[calc(100vh-12px)] flex-col overflow-hidden rounded-[var(--radius-block)] bg-bg">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
      </body>
    </html>
  )
}
