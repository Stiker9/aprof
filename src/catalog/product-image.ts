import { ballIconSrc } from '@/catalog/ball-icon'

/**
 * Какой снимок показывать вместо каталога поставщика.
 *
 * Фотографии со стенда не публикуем вовсе: у каждого проверенного завода
 * снимок несёт замощённый по всей площади знак «ФАРКОП.РФ» с чужим
 * телефоном — это реклама конкурента, а не наша. Исключений не нашлось.
 *
 * Схема — другое дело, но годится не у всех. У Steinhof, GALIA, Oris,
 * ТСС, PT GROUP, Motodor и Berg чертёж либо вовсе без чужого знака,
 * либо с логотипом самого завода — это его собственная реклама, и
 * ставить её можно. У Лидер-плюс, AvtoS, Трейлер, Sheriff, БИЗОН и
 * АвтоСтандарт та же схема несёт тот же чужой знак — не используем.
 *
 * Если для товара из проверенного завода схема есть — показываем её,
 * настоящую, этого артикула. Если схемы нет или завод не проверен —
 * обобщённый рисунок по типу шара (ballIconSrc).
 */
const CLEAN_SCHEMA_MANUFACTURERS = new Set([
  'Steinhof',
  'GALIA',
  'Oris',
  'ТСС',
  'PT GROUP',
  'Motodor',
  'Berg',
])

export interface ProductDisplayImage {
  src: string
  /** 'schema' — настоящий чертёж этого артикула, 'icon' — обобщённый рисунок. */
  kind: 'schema' | 'icon'
}

export function productDisplayImage(product: {
  manufacturer: string
  images: string[]
  ballType: string | null
}): ProductDisplayImage {
  if (CLEAN_SCHEMA_MANUFACTURERS.has(product.manufacturer)) {
    const schema = product.images.find((url) => url.includes('/shema/'))
    if (schema) return { src: schema, kind: 'schema' }
  }
  return { src: ballIconSrc(product.ballType), kind: 'icon' }
}
