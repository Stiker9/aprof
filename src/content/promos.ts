/**
 * Акции.
 *
 * Заказчик прислал три примера, и они распадаются на две структуры,
 * а не на одну: у обычной акции есть текст, у акционных позиций —
 * список «модель → скидка», который он заполняет и меняет вручную.
 * Единое поле «текст акции» такой список не удержит, поэтому типы
 * разделены здесь и в таком же виде уйдут в админку.
 *
 * Тексты — заглушки до согласования с заказчиком.
 */

/** Срок действия: до даты или бессрочно. */
export type PromoPeriod = { kind: 'until'; label: string } | { kind: 'permanent' }

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
}

export type Promo =
  | (PromoBase & { kind: 'text' })
  | (PromoBase & { kind: 'list'; items: PromoItem[] })

export const PROMOS: Promo[] = [
  {
    kind: 'text',
    slug: 'akciya-avgusta',
    title: 'Установка со скидкой 20%',
    lead: 'На автомобили не старше трёх лет — со штатными точками крепления работа идёт быстрее.',
    period: { kind: 'until', label: 'До 31 августа' },
  },
  {
    kind: 'text',
    slug: 'privedi-druga',
    title: 'Приведи друга',
    lead: 'Скидка 10% вам и столько же тому, кого вы привели. Считается при записи.',
    period: { kind: 'permanent' },
  },
  {
    kind: 'list',
    slug: 'akcionnye-pozicii',
    title: 'Акционные позиции',
    lead: 'Модели, на которые сейчас действует скидка на установку.',
    period: { kind: 'permanent' },
    items: [
      { model: 'Lada Vesta', discount: '−15%' },
      { model: 'Hyundai Creta', discount: '−15%' },
      { model: 'Kia Rio', discount: '−12%' },
      { model: 'Renault Duster', discount: '−12%' },
      { model: 'Volkswagen Polo', discount: '−10%' },
    ],
  },
]
