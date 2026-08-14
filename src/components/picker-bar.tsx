import Link from 'next/link'
import { urls } from '@/catalog/urls'

/**
 * Строка подбора: марка, модель, кузов и годы.
 *
 * Стоит сразу под шапкой на главной и на страницах каталога — это
 * основной вход в подбор, и он не должен переезжать от страницы
 * к странице.
 *
 * Пока это разметка без работы: списки не раскрываются, кнопка ведёт
 * в каталог. Живой подбор — три связанных списка на 106 марок — требует
 * состояния на клиенте и идёт отдельной задачей.
 *
 * Первое поле выделено плотнее остальных: подбор начинается с марки,
 * и глаз должен попадать туда, а не в середину строки.
 */
const FIELD = 'flex flex-1 items-center justify-between rounded-[10px] border px-4 py-3 text-sm'
const FIELD_FIRST = 'border-white/12 bg-surface-3 text-ink-muted'
const FIELD_REST = 'border-white/6 bg-surface-3/50 text-ink-muted'

export function PickerBar({
  brand,
  model,
  variant,
}: {
  /** Выбранные значения, если страница уже сузила подбор. */
  brand?: string
  model?: string
  variant?: string
} = {}) {
  const fields = [
    { placeholder: 'Марка', value: brand },
    { placeholder: 'Модель', value: model },
    { placeholder: 'Кузов и годы', value: variant },
  ]

  return (
    <div className="bg-bg">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-2.5 px-6 py-4 lg:flex-row">
        {fields.map((field, index) => (
          <div
            key={field.placeholder}
            className={`${FIELD} ${index === 0 ? FIELD_FIRST : FIELD_REST}`}
          >
            <span className={field.value ? 'text-ink' : undefined}>
              {field.value ?? field.placeholder}
            </span>
            <span aria-hidden className="text-xs opacity-50">
              ▾
            </span>
          </div>
        ))}

        <Link
          href={urls.catalog()}
          className="rounded-[10px] bg-accent px-10 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Подобрать
        </Link>
      </div>
    </div>
  )
}
