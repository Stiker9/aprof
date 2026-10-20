import table from '../../data/content-lists.json'

/**
 * Списки, заведённые владельцем: отзывы, акции, снимки работ.
 *
 * ── Почему файл, а не база ──
 *
 * Та же причина, что и у ./overrides.ts: страницы сайта синхронные и
 * собираются статикой. Отзывы показываются и на главной, и на странице
 * отзывов, и в блоке «С 2014 года» — делать ради них асинхронным
 * полсайта незачем.
 *
 * Файл собирает scripts/apply-overrides.ts перед сборкой. В него
 * попадает только то, что владелец пометил «показывать», и только
 * заполненное: отзыв без текста или снимок без фотографии до витрины
 * не доходят. Проверка стоит там, а не здесь, — здесь данные уже
 * готовы к показу.
 *
 * ── Почему файл обязан существовать ──
 *
 * Без него падает не сборка, а разбор типов, то есть вся разработка.
 * Поэтому в репозитории лежит пустой `{}`.
 */

export interface OwnReview {
  author: string
  car: string
  text: string
  date: string
}

export interface OwnPromoItem {
  model: string
  discount: string
}

export interface OwnPromo {
  slug: string
  title: string
  lead: string
  kind: 'text' | 'list'
  discount: string
  discountNote: string
  items: OwnPromoItem[]
  /** ГГГГ-ММ-ДД или пусто — бессрочная. */
  until: string
}

export interface OwnFaq {
  id: string
  scope: 'home' | 'catalog'
  question: string
  answer: string
}

export interface OwnWork {
  car: string
  article: string
  photo: string
  href: string
}

interface Lists {
  reviews?: OwnReview[]
  promos?: OwnPromo[]
  works?: OwnWork[]
  faq?: OwnFaq[]
}

const LISTS = table as Lists

export function ownReviews(): OwnReview[] {
  return LISTS.reviews ?? []
}

export function ownPromos(): OwnPromo[] {
  return LISTS.promos ?? []
}

export function ownWorks(): OwnWork[] {
  return LISTS.works ?? []
}

/**
 * Добавленные владельцем вопросы одного списка.
 *
 * Разделение на два списка идёт здесь, а не в запросе: списков всего
 * два, вопросов десятки, и отбор по полю дешевле второго файла.
 */
export function ownFaq(scope: 'home' | 'catalog'): { id: string; question: string; answer: string }[] {
  return (LISTS.faq ?? [])
    .filter((item) => item.scope === scope)
    .map((item) => ({ id: item.id, question: item.question, answer: item.answer }))
}
