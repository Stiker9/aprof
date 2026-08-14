/**
 * Логотипы марок из макета.
 *
 * Список закрытый и проверяется на сборке: файлы лежат в
 * public/images/logos, и если марки здесь нет, плитка выводится без
 * картинки — так и задумано в макете. Строить путь прямо из адреса
 * марки нельзя: у 106 марок логотипов всего 25, и остальные давали бы
 * запросы к несуществующим файлам.
 *
 * Пополняется вместе с папкой логотипов.
 */
const AVAILABLE = new Set([
  'audi',
  'bmw',
  'byd',
  'changan',
  'chery',
  'chevrolet',
  'citroen',
  'fiat',
  'ford',
  'geely',
  'genesis',
  'honda',
  'hyundai',
  'kia',
  'land-rover',
  'lexus',
  'mazda',
  'mercedes',
  'nissan',
  'opel',
  'skoda',
  'subaru',
  'toyota',
  'volkswagen',
  'volvo',
])

/** Путь к логотипу марки или null, если его нет. */
export function logoFor(brandSlug: string): string | null {
  return AVAILABLE.has(brandSlug) ? `/images/logos/${brandSlug}.webp` : null
}
