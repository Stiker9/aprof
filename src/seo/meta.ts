/**
 * Заголовки и описания страниц каталога для выдачи.
 *
 * Страниц больше восьми тысяч, и писать их руками нельзя — собираем из
 * данных каталога. Правила длины взяты из практики сниппетов:
 *
 *  - title до 60 знаков: дальше Яндекс и Google обрезают многоточием,
 *    и хвост с важным словом пропадает;
 *  - description до 170: длиннее обрезается, короче — зря пустое место
 *    в выдаче, где мог стоять довод кликнуть (цена, наличие, срок).
 *
 * Описание строится из фактов, которые есть и на странице: цена,
 * наличие, нагрузка. Тексты поставщика в описание не идут — они
 * одинаковы у всех продавцов, и поисковик не видит в них нашей
 * страницы.
 */

const TITLE_MAX = 60
const DESCRIPTION_MAX = 170

/** Хвост «— купить с установкой» отбрасывается, если title иначе не влезает. */
export function fitTitle(base: string, suffix = ' — купить с установкой'): string {
  const full = `${base}${suffix}`
  return full.length <= TITLE_MAX ? full : base
}

/**
 * Склеивает предложения, пока влезает в лимит описания.
 *
 * Целыми предложениями, а не обрезкой по знакам: обрезанная на полуслове
 * строка в выдаче выглядит как ошибка сайта. Первое предложение остаётся
 * всегда — даже если оно одно длиннее лимита.
 */
export function fitDescription(sentences: string[]): string {
  const kept: string[] = []
  for (const sentence of sentences) {
    if (!sentence) continue
    const next = [...kept, sentence].join(' ')
    if (kept.length > 0 && next.length > DESCRIPTION_MAX) break
    kept.push(sentence)
  }
  return kept.join(' ')
}

/** «от 16 520 ₽» или пустая строка, когда цены нет. */
export function priceFrom(formatted: string | null): string {
  return formatted ? ` от ${formatted}` : ''
}

const SERVICE = 'Установка за один визит в Санкт-Петербурге, доставка по России.'

export function brandDescription(count: string, brand: string, price: string | null): string {
  return fitDescription([
    `${count} на ${brand}${priceFrom(price)}.`,
    'Подбор по модели, кузову и году выпуска.',
    SERVICE,
  ])
}

export function modelDescription(count: string, name: string, price: string | null): string {
  return fitDescription([
    `${count} на ${name}${priceFrom(price)}.`,
    'Подбор по кузову и году выпуска.',
    SERVICE,
  ])
}

export function variantDescription(count: string, label: string, price: string | null): string {
  return fitDescription([`${count} на ${label}${priceFrom(price)}.`, SERVICE])
}

interface ProductMeta {
  manufacturer: string
  article: string
  /** Подпись машины, если фаркоп подходит ровно к одной. */
  car: string | null
  /** Сколько машин, если их несколько. */
  carsLabel: string | null
  price: string
  inStock: boolean
  ballType: string | null
  towLoadKg: number | null
  verticalLoadKg: number | null
}

export function productDescription(p: ProductMeta): string {
  const target = p.car ? ` на ${p.car}` : p.carsLabel ? ` — подходит к ${p.carsLabel}` : ''
  const ball = p.ballType ? `Шар ${p.ballType.split(' ')[0]}` : ''
  const load = p.towLoadKg
    ? `нагрузка ${p.towLoadKg}${p.verticalLoadKg ? `/${p.verticalLoadKg}` : ''} кг`
    : ''
  return fitDescription([
    `Фаркоп ${p.manufacturer} ${p.article}${target}: ${p.price}, ${p.inStock ? 'в наличии' : 'под заказ'}.`,
    [ball, load].filter(Boolean).join(', ') + (ball || load ? '.' : ''),
    SERVICE,
  ])
}
