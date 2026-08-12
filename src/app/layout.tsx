import type { Metadata } from 'next'
import localFont from 'next/font/local'
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

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-[family-name:var(--font-body)]">
        {children}
      </body>
    </html>
  )
}
