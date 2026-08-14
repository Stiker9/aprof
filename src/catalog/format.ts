/**
 * Склонение существительного при числительном по русским правилам.
 *
 * Числа на 11–14 всегда требуют формы «многих», хотя оканчиваются на 1–4:
 * «11 моделей», а не «11 модель». Это самая частая ошибка в подписях,
 * а они выводятся на 8 238 страницах.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  if (abs >= 11 && abs <= 14) return many

  const last = abs % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

/**
 * Разделитель разрядов — неразрывный пробел.
 *
 * Такой же, какой возвращает `toLocaleString('ru-RU')`. Обычный пробел
 * позволил бы «5 808» разорваться по строкам, а число, разъехавшееся
 * по двум строкам, читается как два разных.
 *
 * Вынесен в константу, потому что на глаз он неотличим от обычного:
 * в тестах и сравнениях его нужно писать явно.
 */
export const NBSP = ' '

/** Число с разделением разрядов: «5 808», «11,1». */
export function formatNumber(value: number): string {
  return value.toLocaleString('ru-RU')
}

/**
 * Число вместе со словом в нужной форме: «61 модель», «5 808 фаркопов».
 *
 * Разряды разделяются, потому что счётчики доходят до пяти знаков:
 * «5808 фаркопов» читается как случайный набор цифр.
 */
export function formatCount(n: number, one: string, few: string, many: string): string {
  return `${formatNumber(n)} ${plural(n, one, few, many)}`
}

/** Цена: «15 990 ₽». */
export function formatPrice(value: number): string {
  return `${formatNumber(value)}${NBSP}₽`
}

/** Диапазон лет выпуска. Пустая строка, если годов в данных нет. */
export function formatYears(from: number | null, to: number | null): string {
  if (from === null) return ''
  return to === null ? `${from} и новее` : `${from}–${to}`
}

/**
 * Короткая подпись кузова — без марки и модели.
 *
 * Нужна там, где марка и модель уже названы рядом: в хлебных крошках
 * и в списке соседних поколений. Если ни кода поколения, ни годов нет,
 * возвращает пустую строку — тогда вызывающий сам решит, что показать.
 */
export function formatVariantShort(
  generation: string | null,
  from: number | null,
  to: number | null,
): string {
  return [generation, formatYears(from, to)]
    .filter((part): part is string => part !== null && part !== '')
    .join(' ')
}

/**
 * Подпись кузова для заголовков и хлебных крошек.
 *
 * Собирается из отдельных полей, а не из названия кузова в базе:
 * там оно кириллическое («Тойота РАВ4»), а марка и модель латинские.
 * Склейка дала бы «Toyota Тойота РАВ4».
 */
export function formatVariantLabel(
  brand: string,
  model: string,
  generation: string | null,
  from: number | null,
  to: number | null,
): string {
  return [brand, model, generation, formatYears(from, to)]
    .filter((part): part is string => part !== null && part !== '')
    .join(' ')
}
