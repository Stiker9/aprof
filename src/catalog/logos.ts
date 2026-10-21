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
 * Ещё 12 взяты с Wikimedia Commons и Википедии (официальные знаки марок,
 * каждый сверен глазами): BAIC, Belgee, Forthing, GAC, Jaecoo, JMC, LDV,
 * Moskvich, Omoda, Sollers, TagAZ, Vortex. Для GAC теперь знак самой
 * GAC Motor, а не Trumpchi.
 *
 * Без логотипов остались 9 марок — свободного файла их знака не нашлось:
 * Ambertruck, Izh, KnewStar, Oting, Polar Stone, Ravon, Solaris, SWM,
 * Xcite. Для них плитка показывает первую букву марки.
 */
const AVAILABLE = new Set([
  'acura',
  'alfa-romeo',
  'audi',
  'baic',
  'belgee',
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
  'forthing',
  'foton',
  'gac',
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
  'jaecoo',
  'jaguar',
  'jeep',
  'jetour',
  'jetta',
  'jmc',
  'kaiyi',
  'kgm',
  'kia',
  'lada',
  'lancia',
  'land-rover',
  'ldv',
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
  'moskvich',
  'nissan',
  'omoda',
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
  'sollers',
  'soueast',
  'ssang-yong',
  'subaru',
  'suzuki',
  'tagaz',
  'tank',
  'tesla',
  'toyota',
  'uaz',
  'volkswagen',
  'volvo',
  'vortex',
  'voyah',
  'wey',
  'zotye',
])

/** Путь к логотипу марки или null, если его нет. */
export function logoFor(brandSlug: string): string | null {
  return AVAILABLE.has(brandSlug) ? `/images/logos/${brandSlug}.webp` : null
}
