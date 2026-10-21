import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import { WorksGrid } from '@/components/works-grid'
import { WORKS } from '@/content/works'

export const metadata: Metadata = {
  title: 'Наши работы — установленные фаркопы',
  description:
    'Фотографии установленных фаркопов с указанием марки и модели автомобиля. Больше 3 800 установок с 2014 года.',
  alternates: { canonical: absolute('/nashi-raboty') },
}

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
          <p className="mt-2 max-w-[52ch] text-sm opacity-75">
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
