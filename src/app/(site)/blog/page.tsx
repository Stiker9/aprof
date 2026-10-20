import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'

export const metadata: Metadata = {
  title: 'Блог о фаркопах и буксировке',
  description:
    'Статьи о выборе фаркопа, типах шара, подключении электрики и буксировке прицепа. Раздел наполняется.',
  alternates: { canonical: absolute('/blog') },
}

/**
 * Блог.
 *
 * Статей пока нет. Страница показывает это прямо, а не изображает
 * наполненный раздел: выдуманные заголовки без текстов дали бы битые
 * ссылки, а поисковику — обещание содержимого, которого нет.
 *
 * Темы взяты из вопросов, которые задают чаще всего, — они же станут
 * планом наполнения.
 */
const PLANNED = [
  'Чем отличаются шары A, C и F и какой нужен вам',
  'Блок согласования: зачем он нужен и что будет без него',
  'Как понять, потребуется ли резать бампер',
  'Съёмный или фиксированный фаркоп: что выбрать',
  'Какую массу прицепа выдержит ваша машина',
]

export default function BlogPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Блог' }]}
      title="Блог"
      summary="Раздел наполняется. Пока самое нужное собрано в ответах на частые вопросы."
    >
      <div className="mt-12 max-w-[70ch]">
        <h2 className="text-[19px] font-medium">О чём напишем</h2>
        <ul className="mt-5">
          {PLANNED.map((topic) => (
            <li key={topic} className="border-b border-line-light py-4 text-[17px] opacity-60">
              {topic}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Вопрос не ждёт статьи?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-60">
            Ответы на самое частое уже собраны, а на остальное ответим по телефону.
          </p>
        </div>
        <Link href={urls.catalog()} className="text-accent hover:underline">
          Частые вопросы →
        </Link>
      </div>
    </CatalogShell>
  )
}
