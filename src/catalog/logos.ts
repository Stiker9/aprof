/**
 * Логотипы марок.
 *
 * Список закрытый и проверяется на сборке: файлы лежат в
 * public/images/logos, и если марки здесь нет, плитка выводится без
 * картинки — так и задумано в макете. Строить путь прямо из адреса
 * марки нельзя: он давал бы запросы к несуществующим файлам.
 *
 * Было 25 логотипов из макета, стало 85: заказчик прислал набор,
 * и недостающие взяты оттуда. Имена файлов совпадают с адресом марки.
 *
 * Пять логотипов лежат под нашим адресом, хотя в наборе назывались
 * иначе — это тот же марочный знак, каждый сверен глазами:
 *
 * - kgm ← ssangyong: KGM это переименованный SsangYong, эмблема та же;
 * - lixiang ← li-auto: одна и та же марка;
 * - cheryexeed ← exeed: тот же знак;
 * - iran-khordo ← iran-khodro: у нас в базе опечатка в названии;
 * - faw ← faw-jiefang: «единица» в овале — групповой знак FAW.
 *
 * GAC логотипа не получил намеренно: в наборе под этим именем лежит
 * знак Trumpchi — отдельной марки внутри GAC, а не самой GAC.
 *
 * Без логотипов остались 21 марка, которых в наборе нет: Sollers,
 * Solaris, Xcite, Omoda, BAIC, Jaecoo, Belgee, Ravon, Oting, KnewStar,
 * Tagaz, Moskvich, Vortex, Forthing, Polar Stone, SWM, GAC, Ambertruck,
 * LDV, Izh, JMC. Плитка без логотипа — обычное состояние, а не поломка.
 */
const AVAILABLE = new Set([
  'acura',
  'alfa-romeo',
  'audi',
  'bmw',
  'byd',
  'cadillac',
  'changan',
  'chery',
  'cheryexeed',
  'chevrolet',
  'chrysler',
  'citroen',
  'cupra',
  'dacia',
  'daewoo',
  'daihatsu',
  'datsun',
  'dodge',
  'dongfeng',
  'ds',
  'exeed',
  'faw',
  'fiat',
  'ford',
  'foton',
  'gaz',
  'geely',
  'genesis',
  'great-wall',
  'haval',
  'honda',
  'hongqi',
  'hummer',
  'hyundai',
  'infiniti',
  'iran-khordo',
  'isuzu',
  'iveco',
  'jac',
  'jaguar',
  'jeep',
  'jetour',
  'jetta',
  'kaiyi',
  'kgm',
  'kia',
  'lada',
  'lancia',
  'land-rover',
  'lexus',
  'li-auto',
  'lifan',
  'lincoln',
  'lixiang',
  'lynk-co',
  'maserati',
  'mazda',
  'mercedes',
  'mg',
  'mini',
  'mitsubishi',
  'nissan',
  'opel',
  'peugeot',
  'pontiac',
  'porsche',
  'renault',
  'rover',
  'rox',
  'saab',
  'seat',
  'skoda',
  'soueast',
  'ssang-yong',
  'subaru',
  'suzuki',
  'tank',
  'tesla',
  'toyota',
  'uaz',
  'volkswagen',
  'volvo',
  'voyah',
  'wey',
  'zotye',
])

/** Путь к логотипу марки или null, если его нет. */
export function logoFor(brandSlug: string): string | null {
  return AVAILABLE.has(brandSlug) ? `/images/logos/${brandSlug}.webp` : null
}
