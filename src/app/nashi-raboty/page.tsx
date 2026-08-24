import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { WorksGrid } from '@/components/works-grid'

export const metadata: Metadata = {
  title: 'Наши работы — установленные фаркопы',
  description:
    'Фотографии установленных фаркопов с указанием марки и модели автомобиля. Больше 3 800 установок с 2014 года.',
  alternates: { canonical: absolute('/nashi-raboty') },
}

/**
 * Настоящие снимки установок из сервиса — 19 работ, снятых на подъёмнике.
 *
 * Марки указаны по шильдикам на самих фотографиях, а не выдуманы. Модель
 * фаркопа проставлена только там, где её видно на снимке (шильдик или
 * наклейка на кронштейне): подписывать артикул наугад для сайта, где по
 * нему подбирают деталь, значит вводить человека в заблуждение.
 *
 * Порядок не случайный: светлые и тёмные кузова чередуются. Подряд
 * несколько белых машин в сетке сливаются в одно пятно.
 *
 * Три кадра — крупные планы самого узла без машины в кадре; у них в
 * подписи стоит то, что на них изображено.
 */
interface Work {
  /** Марка и модель по шильдику, либо описание для крупного плана. */
  car: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
  photo: string
  /**
   * Страница фаркопов для этой машины. Необязателен: у крупных планов
   * узла машины в кадре нет, а у Mercedes не удалось определить модель
   * по шильдику — вести такие снимки некуда.
   */
  href?: string
}

const WORKS: Work[] = [
  { car: 'Chery Tiggo 8 Pro Max', photo: '/images/gallery/chery-tiggo-8-pro-max.webp', href: urls.model('chery', 'tiggo-8-pro-max') },
  { car: 'Mazda CX-5', photo: '/images/gallery/mazda-cx5.webp', href: urls.model('mazda', 'cx-5') },
  { car: 'Geely Belgee X70', photo: '/images/gallery/geely-belgee-x70.webp', href: urls.model('geely', 'belgee-x70') },
  { car: 'Skoda Superb', photo: '/images/gallery/skoda-superb.webp', href: urls.model('skoda', 'superb') },
  { car: 'Lexus NX', photo: '/images/gallery/lexus-nx.webp', href: urls.model('lexus', 'nx') },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8.webp', href: urls.model('audi', 'q8') },
  { car: 'BMW X6', photo: '/images/gallery/bmw-x6.webp', href: urls.model('bmw', 'x6') },
  { car: 'Renault Duster', photo: '/images/gallery/renault-duster.webp', href: urls.model('renault', 'duster') },
  { car: 'Haval F7', photo: '/images/gallery/haval-f7.webp', href: urls.model('haval', 'f7') },
  { car: 'Mercedes-Benz', photo: '/images/gallery/mercedes-benz.webp' },
  { car: 'Nissan X-Trail', photo: '/images/gallery/nissan-x-trail.webp', href: urls.model('nissan', 'x-trail') },
  { car: 'Kia Rio', photo: '/images/gallery/kia-rio.webp', href: urls.model('kia', 'rio') },
  { car: 'Haval M6', photo: '/images/gallery/haval-m6.webp', href: urls.model('haval', 'm6') },
  { car: 'Skoda Rapid', photo: '/images/gallery/skoda-rapid.webp', href: urls.model('skoda', 'rapid') },
  { car: 'Lada Largus', photo: '/images/gallery/lada-largus.webp', href: urls.model('lada', 'largus') },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8-2.webp', href: urls.model('audi', 'q8') },
  { car: 'Фаркоп с розеткой', article: 'Motodor', photo: '/images/gallery/detal-motodor.webp' },
  { car: 'Шар и посадочный квадрат', photo: '/images/gallery/detal-sharovaya.webp' },
  { car: 'Lada Largus', article: 'Berg', photo: '/images/gallery/detal-berg-largus.webp' },
]

/** Модели из галереи без повторов — для строки ссылок под ней. */
const LINKED_MODELS = WORKS.filter(
  (work, index) => work.href && WORKS.findIndex((other) => other.href === work.href) === index,
)

export default function WorksPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Наши работы' }]}
      title="Галерея работ"
    >
      <div className="mt-12">
        <WorksGrid photos={WORKS} />
      </div>

      {/*
        Строка ссылок под галереей.

        Нужна не для красоты: в самой галерее ссылка появляется только
        после нажатия на снимок, то есть в разметке страницы её нет.
        Поисковый робот по снимкам не щёлкает — он идёт по ссылкам,
        которые нашёл в тексте. Без этой строки страница работ не вела
        бы в каталог вообще, хотя для человека путь есть.

        Дубли убраны: Audi и Largus в галерее встречаются дважды, а две
        одинаковые ссылки подряд ничего не добавляют.
      */}
      <div className="mt-12 border-t border-line-light pt-7">
        <h2 className="text-[15px] font-medium">Фаркопы на эти модели</h2>
        <p className="mt-3 text-sm leading-[1.9]">
          {LINKED_MODELS.map((work, index) => (
            <span key={work.href}>
              {index > 0 ? <span className="opacity-30"> · </span> : null}
              <Link href={work.href!} className="hover:text-accent hover:underline">
                {work.car}
              </Link>
            </span>
          ))}
        </p>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Не нашли свою модель?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            Здесь не все работы — машин через нас прошло больше 3 800. Позвоните,
            скажем сразу, делали ли вашу.
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
