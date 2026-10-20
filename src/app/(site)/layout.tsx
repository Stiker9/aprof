import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { fontVariables } from '@/lib/fonts'
import '../globals.css'

export const metadata: Metadata = {
  title: 'Фаркопы с установкой в Санкт-Петербурге — VASHFARKOP',
  description:
    'Подберём фаркоп по марке, модели и году. Установка за один визит с документами для ТО, доставка по России.',
}

/**
 * Корневой макет сайта.
 *
 * Корневых макетов в проекте два: этот и макет админки. Поэтому папки
 * сайта лежат в группе `(site)` — она не попадает в адреса, но даёт
 * сайту и админке разные `<html>` и `<body>`. Иначе админку обернуло бы
 * шапкой и подвалом сайта, а её таблицы ужало бы общим `zoom: 0.95`.
 *
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
export default function SiteLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="ru" className={`${fontVariables} h-full antialiased`}>
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
