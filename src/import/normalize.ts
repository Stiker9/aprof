/**
 * Канонические написания производителей. Ключ — строка после
 * приведения к нижнему регистру и удаления небуквенных символов.
 * Значение — как выводить на сайте.
 *
 * Отдельно обрабатывается пара ТСС/TCC: это один производитель,
 * записанный кириллицей и латиницей. Автоматически они не склеятся,
 * потому что символы разные, поэтому правило задано явно.
 */
const CANONICAL: Record<string, string> = {
  oris: 'Oris',
  avtos: 'AvtoS',
  berg: 'Berg',
  motodor: 'Motodor',
  лидерплюс: 'Лидер-плюс',
  тсс: 'ТСС',
  tcc: 'ТСС',
}

const foldKey = (s: string): string =>
  s.toLowerCase().replace(/[^a-zа-яё0-9]/gi, '')

/** Приводит написание производителя к каноническому виду. */
export function normalizeManufacturer(raw: string): string {
  const trimmed = raw.trim()
  const key = foldKey(trimmed)
  return CANONICAL[key] ?? trimmed
}

const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh',
  з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c',
  ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e',
  ю: 'yu', я: 'ya',
}

/**
 * Слаг для URL: кириллица транслитерируется, разделители схлопываются.
 *
 * Бросает ошибку, если после очистки не осталось ни одного символа.
 * Пустой слаг — это сломанный адрес страницы, и молча отдавать его
 * нельзя: из слагов собираются пути 8 269 страниц каталога.
 * Пустой результат означает проблему в исходных данных, и о ней
 * надо узнать при импорте, а не при обходе сайта роботом.
 */
export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  if (slug.length === 0) {
    throw new Error(`Из строки «${input}» не получается слаг: не осталось ни одного символа`)
  }

  return slug
}

/**
 * Слаг для артикула товара.
 *
 * Отличается от обычного тем, что точка удаляется, а не превращается
 * в разделитель. Иначе артикулы «J.069» и «J-069» дают один и тот же
 * слаг и один из двух товаров теряет свою страницу.
 * В каталоге такие пары есть: J.069/J-069, K.023/K-023, K.069/K-069.
 */
export function slugifyArticle(article: string): string {
  return slugify(article.replace(/\./g, ''))
}

/**
 * Убирает служебную приставку из названия кузова.
 * В источнике все варианты записаны как «фаркопы для Ауди А6 1997-2004»,
 * на сайте приставка избыточна — мы и так в каталоге фаркопов.
 */
export function cleanVariantName(raw: string): string {
  return raw.replace(/^\s*фаркопы\s+для\s+/i, '').trim()
}

/**
 * Вытаскивает годы из названия кузова.
 * У 818 вариантов из 2550 годов в названии нет — для них
 * возвращается пара null, и это штатная ситуация.
 */
export function parseYears(name: string): { from: number | null; to: number | null } {
  const m = name.match(/(19|20)(\d{2})\s*-\s*((19|20)\d{2})?/)
  if (!m) return { from: null, to: null }

  const from = Number(m[1] + m[2])
  const to = m[3] ? Number(m[3]) : null
  return { from, to }
}

/**
 * Общее начало у группы названий, по словам.
 * У кузовов одной модели это марка и модель.
 */
function commonWordPrefix(names: string[]): number {
  if (names.length === 0) return 0
  const split = names.map((n) => n.split(/\s+/))
  const first = split[0]
  let length = 0
  for (let i = 0; i < first.length; i++) {
    if (split.every((words) => words[i] === first[i])) length++
    else break
  }
  return length
}

/**
 * Слаги кузовов для адресов страниц.
 *
 * Считаются сразу для всего списка, а не по одному: слаг зависит от других
 * кузовов той же модели. Из названия срезается общее начало — марка и модель,
 * которые уже есть в пути. «Шевроле Лачетти седан 2004-2012» превращается
 * в «sedan-2004-2012», а адрес выходит /farkopy/chevrolet/lacetti/sedan-2004-2012
 * вместо /farkopy/chevrolet/lacetti/shevrole-lachetti-sedan-2004-2012.
 *
 * Срезать только марку и модель, оставляя тип кузова, обязательно: у 193 кузовов
 * различие именно в нём. «Лачетти седан» и «Лачетти универсал» идут в одни годы
 * и без кода поколения — по годам они бы схлопнулись в одну страницу.
 *
 * Единственная функция, где рождается слаг кузова. Дедупликация и вставка
 * в базу обязаны пользоваться её результатом, иначе разойдутся между собой
 * и упрутся в уникальный индекс на пару (модель, слаг).
 */
export function buildVariantSlugs(items: { modelIndex: number; name: string }[]): string[] {
  const byModel = new Map<number, number[]>()
  items.forEach((item, index) => {
    if (!byModel.has(item.modelIndex)) byModel.set(item.modelIndex, [])
    byModel.get(item.modelIndex)!.push(index)
  })

  const slugs = new Array<string>(items.length)

  for (const indices of byModel.values()) {
    const names = indices.map((i) => cleanVariantName(items[i].name))
    const prefixLength = commonWordPrefix(names)

    indices.forEach((itemIndex, position) => {
      const words = names[position].split(/\s+/)
      // У модели с единственным кузовом общее начало равно всему названию —
      // срезать нечего, иначе не осталось бы ни одного символа
      const rest = prefixLength < words.length ? words.slice(prefixLength) : words
      slugs[itemIndex] = slugify(rest.join(' '))
    })
  }

  return slugs
}

/**
 * Вытаскивает код поколения из названия кузова.
 *
 * В источнике марка и модель записаны кириллицей («Тойота РАВ4»),
 * а на сайте они берутся из своих таблиц латиницей («Toyota RAV4»).
 * Смешивать их в одной строке нельзя, поэтому из названия кузова
 * нужен только код поколения — латинский токен перед годами.
 *
 * Ищется последовательность из латинских букв и цифр, содержащая
 * хотя бы одну букву и одну цифру: XA10, E120, F15, W203.
 * Чистые числа (147, 156) отбрасываются — это названия моделей Alfa Romeo,
 * а не коды поколений.
 *
 * Второй аргумент — имя модели — обязателен, потому что латинский токен
 * в названии кузова не всегда код поколения: иногда это сама модель,
 * записанная латиницей, если у поколения отдельного кода нет. Например,
 * «Volvo S60 2000-2009» и «Volvo S60 2010-2019» — оба содержат только
 * токен «S60», это название модели, а не два разных поколения. Без
 * сравнения с именем модели функция вернула бы «S60» как код поколения,
 * и подпись на сайте задвоилась бы: «Volvo S60 S60 2000–2009».
 */
export function parseGeneration(name: string, modelName: string): string | null {
  const withoutYears = name.replace(/(19|20)\d{2}\s*-\s*((19|20)\d{2})?/g, ' ')
  const tokens = withoutYears.match(/\b[A-Za-z]+[0-9]+[A-Za-z0-9]*\b/g)
  if (!tokens || tokens.length === 0) return null

  // Сравниваем со ВСЕМИ словами имени модели, а не с именем целиком:
  // у модели «Q3 Sportback» кандидат «Q3» — это её первое слово,
  // и при сравнении с полным именем он бы не отсеялся
  const modelWords = new Set(
    modelName
      .split(/[^A-Za-z0-9]+/)
      .filter((w) => w.length > 0)
      .map((w) => w.toUpperCase()),
  )
  const candidate = tokens[tokens.length - 1].toUpperCase()

  // Токен, совпадающий со словом имени модели, — это модель, а не поколение
  return modelWords.has(candidate) ? null : candidate
}
