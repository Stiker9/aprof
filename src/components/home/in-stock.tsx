import Image from 'next/image'
import Link from 'next/link'
import type { ShowcaseItem } from '@/catalog/showcase'
import { urls } from '@/catalog/urls'

/**
 * «В наличии» — четыре позиции с ценой.
 *
 * Единственный блок на главной, где видно цену: до него человек читал про
 * услуги и смотрел фотографии, но не знал ни одной суммы.
 *
 * Это не витрина с крупными карточками, а строка прайса: картинка мелкая,
 * потому что фото товаров у нас почти нет — на их месте схемы сборки с
 * сайтов заводов. В строке 64×46 схема читается как значок, а в большой
 * карточке выглядела бы технической документацией. Крупные снимки есть у
 * работ — они ниже и живут в своей галерее.
 *
 * Слова «хиты» здесь нет намеренно: данных о продажах у нас нет, и назвать
 * эти позиции хитами значило бы придумать. «В наличии» — правда.
 */
export function InStock({ items }: { items: ShowcaseItem[] }) {
  if (items.length === 0) return null

  return (
    <section className="bg-paper-3 text-ink-dark">
      <div className="px-5 py-12 sm:px-8 sm:py-14 lg:px-14 lg:py-[clamp(44px,5.5vh,72px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-dark/80">Склад</p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
              В наличии
            </h2>
            <p className="mt-3 max-w-[54ch] text-[15px] leading-[1.55] text-[#444442]">
              Позиции со склада на 1-й Жерновской. Цену видно сразу, забрать можно в приёмные часы
              или поставить у нас за один визит.
            </p>
          </div>

          <Link
            href={urls.catalog()}
            className="inline-flex items-center gap-3 rounded-full border border-ink-dark/20 px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-dark"
          >
            Весь каталог <span className="opacity-75" aria-hidden>→</span>
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <Link
              key={item.slug}
              href={urls.product(item.slug)}
              className="group flex flex-col gap-4 rounded-[14px] border border-ink-dark/10 bg-white p-5 transition-shadow hover:shadow-[0_10px_28px_rgba(0,0,0,.08)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span className="flex items-start gap-3">
                <span className="relative block h-[46px] w-[64px] shrink-0 overflow-hidden rounded-md border border-ink-dark/8 bg-[#F7F6F4]">
                  {item.photo ? (
                    <Image
                      src={item.photo}
                      alt={`Фаркоп ${item.manufacturer} ${item.article}`}
                      fill
                      sizes="64px"
                      className="object-contain p-1"
                    />
                  ) : null}
                </span>
                <span className="flex min-w-0 flex-col gap-0.5 pt-1">
                  <span className="truncate text-[15px] leading-[1.25]">{item.manufacturer}</span>
                  <span className="text-[13px] text-[#555553]">арт. {item.article}</span>
                </span>
              </span>

              <span className="text-[13px] leading-[1.4] text-[#444442]">{item.note}</span>

              <span className="mt-auto flex items-end justify-between gap-3 pt-1">
                <span className="font-[family-name:var(--font-display)] text-[22px] leading-none tracking-[-0.02em]">
                  {item.price}
                </span>
                <span
                  aria-hidden
                  className="text-[15px] text-[#555553] transition-colors group-hover:text-accent"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
