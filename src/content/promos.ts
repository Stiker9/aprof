import { urls } from '@/catalog/urls'
import { ownPromos } from './lists'

/**
 * Акции.
 *
 * Заказчик прислал три примера, и они распадаются на две структуры,
 * а не на одну: у обычной акции есть текст, у акционных позиций —
 * список «модель → скидка», который он заполняет и меняет вручную.
 * Единое поле «текст акции» такой список не удержит, поэтому типы
 * разделены здесь и в таком же виде уйдут в админку.
 *
 * Список пуст, и это рабочее состояние. Здесь были три придуманные
 * акции: «−20% в августе», «приведи друга −10%» и «−15% на RAV4,
 * Sportage и Tucson». Скидка, которой нет, — недостоверная реклама, и
 * приехавший за ней человек прав, а мы нет.
 *
 * Заполняется через админку. Пока пусто, блок акций на главной и
 * страница «Акции» показывают, что предложений сейчас нет, — сами,
 * без правки кода.
 */

/**
 * Срок действия: до даты или бессрочно.
 *
 * У срочной акции дата хранится отдельно от подписи, а не только
 * словами. Иначе повторяется то, что уже случилось: «До 31 августа»
 * провисело на главной до октября, потому что строка — это текст, и
 * истечь он сам не может.
 */
export type PromoPeriod =
  | { kind: 'until'; label: string; until: `${number}-${number}-${number}` }
  | { kind: 'permanent' }

/** Строка списка акционных позиций. */
export interface PromoItem {
  model: string
  discount: string
}

interface PromoBase {
  slug: string
  title: string
  lead: string
  period: PromoPeriod
  action: { label: string; href: string }
}

export type Promo =
  | (PromoBase & { kind: 'text'; discount: string; discountNote: string })
  | (PromoBase & { kind: 'list'; items: PromoItem[] })

/**
 * Акции, заведённые владельцем.
 *
 * Собираются из data/content-lists.json. Кнопка у всех одна и та же —
 * «Подобрать фаркоп» на страницу подбора: акция ведёт в каталог, и
 * отдельное поле под адрес кнопки дало бы владельцу возможность
 * однажды увести её в никуда.
 */
const ALL: Promo[] = ownPromos().map((promo): Promo => {
  const base = {
    slug: promo.slug,
    title: promo.title,
    lead: promo.lead,
    period: (promo.until
      ? { kind: 'until' as const, label: `До ${formatUntil(promo.until)}`, until: promo.until as `${number}-${number}-${number}` }
      : { kind: 'permanent' as const }),
    action: { label: 'Подобрать фаркоп', href: '/podbor' },
  }

  return promo.kind === 'list'
    ? { ...base, kind: 'list', items: promo.items }
    : { ...base, kind: 'text', discount: promo.discount, discountNote: promo.discountNote }
})

/**
 * Дата словами для подписи «До 31 августа».
 *
 * Падеж родительный — подпись всегда начинается с «До». Своей
 * таблицей, а не через toLocaleString: там месяц выходит именительным
 * («До август»), и исправлять его пришлось бы всё равно.
 */
function formatUntil(iso: string): string {
  const MONTHS = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ]
  const [, month, day] = iso.split('-').map(Number)
  if (!month || !day || month < 1 || month > 12) return iso
  return `${day} ${MONTHS[month - 1]}`
}

/**
 * Акции, которые показываем.
 *
 * Истёкшие отсеиваются сами. Показывать скидку, которой уже нет, —
 * недостоверная реклама, и повод для претензии от человека, который на
 * неё приехал.
 *
 * Срок считается на сборке, а не у посетителя: страницы статические,
 * «сегодня» для них — момент сборки. Значит акция исчезнет с сайта не в
 * полночь, а при ближайшей пересборке. Для скидок это допустимо, и это
 * всё равно несравнимо лучше текста, который не истекает никогда.
 */
export const PROMOS: Promo[] = ALL.filter((promo) => {
  if (promo.period.kind !== 'until') return true
  return new Date(promo.period.until) >= new Date(new Date().toISOString().slice(0, 10))
})
