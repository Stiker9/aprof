/**
 * Сопоставление артикулов.
 *
 * Один и тот же фаркоп в нашей базе и на сайте завода записан по-разному:
 * «FA 0100-E» и «FA0100E», «3110.КР» и «3110 KP», «H.T94.A» и «HT94A».
 * Различия — только в пробелах, точках и дефисах, поэтому ключ для
 * сравнения из них очищен.
 *
 * Отдельная беда — кириллица, похожая на латиницу. Завод пишет «3110.КР»
 * русскими буквами, наш прайс — латинскими, и глазами это не различить.
 * Поэтому все буквы, у которых есть латинский двойник, приводятся к
 * латинице: сравниваются формы, а не кодировки.
 *
 * Ключ намеренно грубый. Проверка на столкновения — в collisions():
 * если два разных артикула одного завода дают один ключ, сопоставлять
 * по нему нельзя, и адаптер должен уточнить правило.
 */

/** Кириллические буквы, неотличимые от латинских, и их латинские двойники. */
const LOOKALIKE: Record<string, string> = {
  А: 'A', В: 'B', Е: 'E', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', У: 'Y', Х: 'X',
  а: 'a', в: 'b', е: 'e', к: 'k', м: 'm', н: 'h', о: 'o', р: 'p', с: 'c', т: 't', у: 'y', х: 'x',
}

export function articleKey(article: string): string {
  return article
    .split('')
    .map((ch) => LOOKALIKE[ch] ?? ch)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/**
 * Артикулы, которые схлопываются в один ключ.
 *
 * Пустой список — разрешение сопоставлять по ключу. Непустой означает,
 * что для этого завода нужен более точный разбор, иначе картинка уйдёт
 * не тому товару.
 */
export function collisions(articles: string[]): Map<string, string[]> {
  const byKey = new Map<string, string[]>()
  for (const article of articles) {
    const key = articleKey(article)
    const list = byKey.get(key)
    if (list) list.push(article)
    else byKey.set(key, [article])
  }
  const bad = new Map<string, string[]>()
  for (const [key, list] of byKey) {
    if (new Set(list).size > 1) bad.set(key, [...new Set(list)])
  }
  return bad
}
