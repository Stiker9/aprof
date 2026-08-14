import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'

export const metadata: Metadata = {
  title: 'Наши работы — установленные фаркопы',
  description:
    'Фотографии установленных фаркопов с указанием марки, модели и артикула детали. Больше 3 800 установок с 2014 года.',
  alternates: { canonical: absolute('/nashi-raboty') },
}

/**
 * Наши работы.
 *
 * Фотографий пока нет: в базе лежат только снимки товаров с чужого
 * сайта, а установленные фаркопы на машинах есть лишь у заказчика.
 * Здесь стоят заглушки с настоящими подписями — раскладка готова
 * к подстановке снимков, и никто не примет пустой блок за готовый.
 */
const WORKS = [
  { car: 'Toyota RAV4 XA50', article: 'Galia T030A' },
  { car: 'Hyundai Creta I', article: 'Halty H.T97' },
  { car: 'Kia Sportage IV', article: 'Steinhof K-045' },
  { car: 'Renault Duster II', article: 'Bosal R118' },
  { car: 'Volkswagen Tiguan II', article: 'Oris 3247-A' },
  { car: 'Lada Vesta SW Cross', article: 'Лидер-плюс L-102' },
  { car: 'BMW X6 G06', article: 'Westfalia 303451' },
  { car: 'Skoda Octavia A7', article: 'Bosal S-124' },
  { car: 'Mitsubishi Outlander III', article: 'Galia M107' },
]

export default function WorksPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Наши работы' }]}
      title="Три машины в день"
      summary="Снимаем каждую установку — посмотрите, как фаркоп выглядит именно на вашей модели."
    >
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {WORKS.map((work) => (
          <figure key={work.article}>
            <div className="flex aspect-[4/3] items-center justify-center rounded-[var(--radius-card)] border border-line-light bg-white text-xs opacity-40">
              фото скоро
            </div>
            <figcaption className="mt-3 text-sm">
              {work.car} · <span className="opacity-55">{work.article}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Не нашли свою модель?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            За двенадцать лет через нас прошло больше 3 800 машин — скорее всего, вашу мы уже
            делали. Позвоните и спросите.
          </p>
        </div>
        <Link
          href={urls.catalog()}
          className="rounded-[10px] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Подобрать фаркоп
        </Link>
      </div>
    </CatalogShell>
  )
}
