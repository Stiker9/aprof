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
  transparent = false,
}: {
  /** Выбранные значения, если страница уже сузила подбор. */
  brand?: string
  model?: string
  variant?: string
  /** На первом экране строка лежит на фотографии, своего фона у неё нет. */
  transparent?: boolean
} = {}) {
  const fields = [
    { placeholder: 'Марка', value: brand },
    { placeholder: 'Модель', value: model },
    { placeholder: 'Кузов и годы', value: variant },
  ]

  return (
    <div
      className={
        transparent
          ? 'border-b border-white/8 bg-[rgba(10,10,11,0.72)] backdrop-blur-[22px] backdrop-saturate-[1.3]'
          : 'bg-bg pt-14'
      }
    >
      <div
        className={`mx-auto flex flex-col gap-2.5 lg:flex-row ${
          transparent ? 'px-14 py-4' : 'max-w-[1400px] px-6 py-4'
        }`}
      >
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
          className="shrink-0 rounded-[10px] bg-accent px-[34px] py-3.5 text-center text-sm font-semibold text-white transition-[filter] hover:brightness-110"
        >
          Подобрать
        </Link>
      </div>
    </div>
  )
}
