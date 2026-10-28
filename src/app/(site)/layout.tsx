import type { Metadata } from 'next'
import { SiteFooter } from '@/components/site-footer'
import { Metrika } from '@/components/metrika'
import { SiteHeader } from '@/components/site-header'
import { SmoothScroll } from '@/components/smooth-scroll'
import { fontVariables } from '@/lib/fonts'
import { SITE_URL } from '@/catalog/urls'
import { JsonLd } from '@/seo/json-ld'
import { businessSchema, SITE_NAME, websiteSchema } from '@/seo/schema'
import '../globals.css'

/*
  Превью ссылки в мессенджерах и соцсетях.

  Здесь только общее для всех страниц: название сайта, язык и картинка.
  Заголовка и описания в openGraph намеренно нет. Next сливает метаданные
  поверхностно: openGraph страницы целиком заменяет макетный, а если
  страница его не задаёт — наследует как есть. Задай здесь og:title, и
  любая ссылка на товар в Telegram показала бы заголовок главной.
  Без og:title мессенджеры берут обычный <title> страницы — свой у каждой.

  Картинка — JPEG, не WebP: WebP в превью понимают не все клиенты.
  1200×630 и 129 КБ — в пределах, после которых WhatsApp ужимает или
  не показывает превью.
*/
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'Фаркопы с установкой в Санкт-Петербурге — VASHFARKOP',
  description:
    'Подберём фаркоп по марке, модели и году. Установка за один визит с документами для ТО, доставка по России.',
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ru_RU',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Автомобиль с фаркопом и велосипедами' }],
  },
  twitter: { card: 'summary_large_image' },
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
        {/* На каждой странице: товары ссылаются на продавца по его @id. */}
        <JsonLd data={[businessSchema(), websiteSchema()]} />
        <SmoothScroll />
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          {children}
          <SiteFooter />
        </div>
        <Metrika />

      </body>
    </html>
  )
}
