/**
 * Адрес сайта. Нужен для канонических ссылок, карты сайта и микроразметки —
 * там требуются абсолютные адреса.
 *
 * Главный домен — vashfarkop.ru. Проверено 12.10.2026: и он, и
 * vashfarkop.online зарегистрированы на reg.ru и указывают на один
 * адрес 37.140.192.12.
 *
 * Главным выбран .ru, а не .online, по двум причинам. Для питерского
 * сервиса национальная зона читается привычнее. И цена: .online стоит
 * 249 ₽ первый год и 4 067 ₽ дальше, а .ru — 169 ₽ и бесплатное
 * продление при хостинге от года. Разница в двадцать раз на пустом месте.
 *
 * .online не бросаем — с него ставится постоянное перенаправление сюда.
 *
 * Здесь строятся канонические адреса всех 8 262 страниц и карта сайта,
 * поэтому менять домен после запуска дорого: поисковики переучиваются
 * месяцами. Подменяется переменной NEXT_PUBLIC_SITE_URL без правки кода.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vashfarkop.ru'

/**
 * Все пути каталога строятся только здесь.
 *
 * Иначе адреса расползаются по компонентам, и переименование раздела
 * превращается в поиск по строкам с риском пропустить ссылку.
 */
export const urls = {
  home: (): string => '/redesign',
  catalog: (): string => '/redesign/farkopy',
  brand: (brandSlug: string): string => `/farkopy/${brandSlug}`,
  model: (brandSlug: string, modelSlug: string): string => `/farkopy/${brandSlug}/${modelSlug}`,
  variant: (brandSlug: string, modelSlug: string, variantSlug: string): string =>
    `/farkopy/${brandSlug}/${modelSlug}/${variantSlug}`,
  product: (articleSlug: string): string => `/tovar/${articleSlug}`,
}

/** Абсолютный адрес для канонических ссылок и разметки. */
export function absolute(path: string): string {
  return `${SITE_URL}${path}`
}
