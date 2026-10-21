import type { ComponentType } from 'react'
import { MassaPricepa, MASSA_PRICEPA_FAQ } from './massa-pricepa'
import { TipySharov, TIPY_SHAROV_FAQ } from './tipy-sharov'

export interface FaqItem {
  question: string
  answer: string
}

export interface BlogPost {
  slug: string
  /** Заголовок статьи, он же H1 и подпись на карточке. */
  title: string
  /** Title для поисковика — до 60 знаков, главный запрос в начале. */
  seoTitle: string
  description: string
  category: string
  /** Две строки на карточке в блоге и на главной. */
  excerpt: string
  image: string
  imageAlt: string
  /** ISO-дата публикации — для разметки Article и подписи под заголовком. */
  published: string
  Body: ComponentType
  faq: FaqItem[]
}

/**
 * Опубликованные статьи блога.
 *
 * Тексты пишутся по промту docs/seo/prompt-teksty.md, черновики с
 * источниками лежат в docs/seo/stati. Сюда статья попадает только
 * после проверки фактов: в черновике спорные места помечены, здесь
 * меток быть не должно.
 *
 * Новые — в начало списка: порядок здесь и есть порядок в блоге.
 */
export const POSTS: BlogPost[] = [
  {
    slug: 'tipy-sharov-farkopa',
    title: 'Чем отличаются шары A, C и F и какой нужен вам',
    seoTitle: 'Типы шара фаркопа A, C и F: чем отличаются и что выбрать',
    description:
      'Шар A на двух болтах, быстросъёмный C и фланцевый F: как крепятся, сколько держат и какой выбрать под вашу машину и частоту поездок с прицепом.',
    category: 'Выбор фаркопа',
    excerpt:
      'Шар A, C или F — от этого зависит, какие прицепы и багажники вы сможете возить и придётся ли снимать фаркоп на мойке. Разбираем на примерах.',
    image: '/images/blog/tipy-sharov-farkopa.webp',
    imageAlt: 'Фаркоп с шаром и страховочными цепями на серебристом внедорожнике перед прицепом-фургоном',
    published: '2026-10-21',
    Body: TipySharov,
    faq: TIPY_SHAROV_FAQ,
  },
  {
    slug: 'massa-pricepa',
    title: 'Какую массу прицепа выдержит ваша машина',
    seoTitle: 'Какую массу прицепа выдержит машина: ПТС и нагрузка на шар',
    description:
      'Где в ПТС и инструкции найти допустимую массу прицепа, чем она отличается от нагрузки на шар и как посчитать реальный вес лодки с прицепом до поездки.',
    category: 'Буксировка',
    excerpt:
      'Где в ПТС искать допустимую массу прицепа, чем она отличается от нагрузки на шар и почему лодку с прицепом стоит взвесить заранее.',
    image: '/images/blog/massa-pricepa.webp',
    imageAlt: 'Тёмно-синий Volvo XC90 с катером на прицепе у лесного озера',
    published: '2026-10-21',
    Body: MassaPricepa,
    faq: MASSA_PRICEPA_FAQ,
  },
]

export function getPost(slug: string): BlogPost | undefined {
  return POSTS.find((post) => post.slug === slug)
}

export const blogUrl = (slug: string): string => `/blog/${slug}`
