import { urls } from '@/catalog/urls'

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
  action: { label: string; href: string }
}

export type Promo =
  | (PromoBase & { kind: 'text'; discount: string; discountNote: string })
  | (PromoBase & { kind: 'list'; items: PromoItem[] })

export const PROMOS: Promo[] = [
  {
    kind: 'text',
    slug: 'akciya-avgusta',
    title: 'Акция августа',
    lead: 'Установка на автомобили моложе 3 лет',
    period: { kind: 'until', label: 'До 31 августа' },
    discount: '−20%',
    discountNote: 'на установку',
    action: { label: 'Записаться', href: '/zapis' },
  },
  {
    kind: 'text',
    slug: 'privedi-druga',
    title: 'Приведи друга',
    lead: 'Скидка вам и другу',
    period: { kind: 'permanent' },
    discount: '−10%',
    discountNote: 'обоим',
    action: { label: 'Как это работает', href: '/akcii' },
  },
  {
    kind: 'list',
    slug: 'akcionnye-pozicii',
    title: 'Акционные модели',
    lead: 'Установка со скидкой в августе',
    period: { kind: 'permanent' },
    items: [
      { model: 'Toyota RAV4', discount: 'скидка 15%' },
      { model: 'Kia Sportage', discount: 'скидка 15%' },
      { model: 'Hyundai Tucson', discount: 'скидка 15%' },
    ],
    action: { label: 'Проверить свою модель', href: urls.catalog() },
  },
]
