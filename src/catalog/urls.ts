/**
 * Адрес сайта. Нужен для канонических ссылок, карты сайта и микроразметки —
 * там требуются абсолютные адреса.
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://autoprofi.spb.ru'

/**
 * Все пути каталога строятся только здесь.
 *
 * Иначе адреса расползаются по компонентам, и переименование раздела
 * превращается в поиск по строкам с риском пропустить ссылку.
 */
export const urls = {
  home: (): string => '/',
  catalog: (): string => '/farkopy',
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
