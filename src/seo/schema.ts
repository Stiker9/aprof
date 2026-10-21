/**
 * Микроразметка schema.org — все типы сайта в одном месте.
 *
 * Разметка не поднимает позиции сама по себе (так прямо пишет справка
 * Яндекс Вебмастера), но делает сниппет заметнее и даёт поисковикам и
 * их нейроответам готовые факты: кто мы, где, сколько стоит.
 *
 * ── Главное правило: только правда ──
 *
 * Сюда идёт лишь то, что подтверждено и видно на самой странице.
 * Поисковики сверяют разметку с текстом, расхождение — повод для
 * ручной санкции. Поэтому намеренно НЕ размечены:
 *
 *  - почта, ИНН, ОГРН — заглушки (content/contacts.ts);
 *  - рейтинг и отзывы — Google запрещает размечать отзывы о себе на
 *    своём же сайте (self-serving reviews), Яндекс берёт их с Карт.
 *
 * Часы работы размечены, но пока это предположение (9:00–20:00), см.
 * openingHours в content/contacts.ts — заменить, когда заказчик назовёт.
 */
import { absolute, urls } from '@/catalog/urls'
import { CONTACTS } from '@/content/contacts'

/**
 * Единый идентификатор сервиса.
 *
 * Товары и статьи ссылаются на продавца по нему, а не повторяют адрес
 * и телефон в каждой из 8 000 страниц: поисковик склеивает все
 * упоминания в одну организацию.
 */
export const BUSINESS_ID = absolute('/#business')
const WEBSITE_ID = absolute('/#website')

export const SITE_NAME = 'VASHFARKOP'

/** Координаты ворот сервиса — те же, по которым строится маршрут на Картах. */
const GEO = { latitude: 59.964674, longitude: 30.483296 }

/**
 * Сервис как организация.
 *
 * Тип AutoRepair — самый точный подтип LocalBusiness для автосервиса;
 * Google просит брать наиболее конкретный. Один тип, а не пара
 * [AutoRepair, Store]: массив типов валидаторы Яндекса разбирают хуже,
 * а продажу и так видно по разметке Product с продавцом-сервисом.
 *
 * Адрес разложен по полям, а не одной строкой: так его надёжнее
 * сопоставить с карточкой на Яндекс.Картах, ссылка на которую стоит
 * в sameAs.
 */
export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRepair',
    '@id': BUSINESS_ID,
    name: SITE_NAME,
    description:
      'Продажа и установка фаркопов в Санкт-Петербурге: подбор по марке и модели, установка за один визит, документы для техосмотра, доставка по России.',
    url: absolute(urls.home()),
    logo: absolute('/images/redesign/vashfarkop-logo.webp'),
    image: absolute('/og-image.jpg'),
    telephone: CONTACTS.phoneHref.replace('tel:', ''),
    address: {
      '@type': 'PostalAddress',
      // Город стоит отдельным полем, из строки адреса он убирается.
      streetAddress: CONTACTS.address.replace(/^г\.\s*Санкт-Петербург,\s*/, ''),
      addressLocality: 'Санкт-Петербург',
      addressRegion: 'Санкт-Петербург',
      addressCountry: 'RU',
    },
    geo: { '@type': 'GeoCoordinates', ...GEO },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: CONTACTS.openingHours.opens,
      closes: CONTACTS.openingHours.closes,
    },
    hasMap: CONTACTS.mapUrl,
    sameAs: [CONTACTS.mapUrl],
    areaServed: [
      { '@type': 'City', name: 'Санкт-Петербург' },
      { '@type': 'Country', name: 'Россия' },
    ],
    currenciesAccepted: 'RUB',
  }
}

/** Сайт целиком — связывает название с адресом и с организацией. */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    name: SITE_NAME,
    url: absolute(urls.home()),
    inLanguage: 'ru-RU',
    publisher: { '@id': BUSINESS_ID },
  }
}

interface ProductInput {
  name: string
  article: string
  manufacturer: string
  description: string
  price: number
  inStock: boolean
  /** Адрес страницы товара, относительный. */
  path: string
  /** Свой снимок артикула. Обобщённый рисунок сюда не передаётся. */
  image?: string
}

/**
 * Товар с ценой.
 *
 * Без цены разметку не отдаём вовсе: Product без offers не даёт
 * сниппета, а «0 ₽» в выдаче хуже, чем ничего.
 *
 * Наличие — двумя состояниями, как на самой странице: «в наличии» или
 * «под заказ» (BackOrder — можно заказать, привезут). PreOrder не
 * подходит: он про товар, которого ещё не выпустили.
 *
 * priceValidUntil не ставим: дата в прошлом прячет сниппет, а цены
 * обновляются выгрузкой без расписания — дата неизбежно протухнет.
 */
export function productSchema(input: ProductInput) {
  if (!(input.price > 0)) return null
  const url = absolute(input.path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: input.name,
    sku: input.article,
    mpn: input.article,
    brand: { '@type': 'Brand', name: input.manufacturer },
    category: 'Фаркопы (тягово-сцепные устройства)',
    description: input.description.slice(0, 500),
    ...(input.image ? { image: absolute(input.image) } : {}),
    url,
    offers: {
      '@type': 'Offer',
      url,
      price: input.price,
      priceCurrency: 'RUB',
      availability: input.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/BackOrder',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': BUSINESS_ID },
    },
  }
}

/**
 * Вопросы и ответы.
 *
 * Google с 2023 года не показывает FAQ-сниппеты обычным сайтам, а в
 * 2026 убрал их совсем. Разметку оставляем ради Яндекса и нейроответов:
 * пары «вопрос — ответ» им проще всего процитировать.
 *
 * Один набор вопросов — одна страница. Те же вопросы на главной и на
 * странице установки размечены только на второй: дубли разметки
 * поисковики считают спамом.
 */
export function faqSchema(items: { question: string; answer: string }[]) {
  if (items.length === 0) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  }
}
