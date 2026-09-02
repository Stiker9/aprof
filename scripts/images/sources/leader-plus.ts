/**
 * Лидер-плюс — leader-plus.ru
 *
 * Российский завод из Дмитрова, выпускает ТСУ с 1997 года; в нашей базе
 * 379 его артикулов, и ни у одного нет пригодной схемы — в выгрузке
 * поставщика все они с чужим знаком.
 *
 * Каталог отдаётся картой сайта, адрес товара строится из артикула:
 * /catalog1c/farkopy/acura/mdx/a201-a/ — то есть сопоставлять можно по
 * последнему сегменту, не разбирая страницу. Это дёшево: из 743 карточек
 * завода мы открываем только те 379, что нам нужны.
 *
 * На карточке три изображения, и порядок в разметке не совпадает с
 * полезностью: первой идёт рекламная плашка завода, а нужный нам чертёж
 * сборки лежит третьим. Поэтому берём все три и отдаём ядру — сорт
 * определит classify по самой картинке, а не по месту в разметке.
 *
 * robots.txt раздел /catalog1c не закрывает (проверено 02.09.2026).
 */
import { fetchText } from '../core/http'
import { articleKey } from '../core/match'
import type { DiscoverContext, Source, SourceProduct } from '../core/types'

const ORIGIN = 'https://www.leader-plus.ru'
const SITEMAP = `${ORIGIN}/sitemap.xml`

/** Полноразмерные картинки лежат в href, уменьшенные копии — в src. */
const FULL_IMAGE = /href="(\/images\/editor\/1c-import\/import_files\/[^"]+\.(?:jpe?g|png|webp))"/gi

/** /catalog1c/farkopy/<марка>/<модель>/<артикул>/ — ровно пять сегментов. */
const PRODUCT_URL = /^https?:\/\/[^/]+\/catalog1c\/farkopy\/[^/]+\/[^/]+\/([^/]+)\/$/

export const leaderPlus: Source = {
  id: 'leader-plus',
  site: ORIGIN,
  manufacturers: ['Лидер-плюс'],

  async *discover(ctx: DiscoverContext): AsyncGenerator<SourceProduct> {
    const sitemap = await fetchText(SITEMAP)
    if (!sitemap) {
      console.warn('  ! карта сайта Лидер-плюс не открылась')
      return
    }

    const seen = new Set<string>()
    let opened = 0

    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const found = match[1].trim().match(PRODUCT_URL)
      if (!found) continue

      const article = found[1]
      const key = articleKey(article)
      if (!ctx.needed.has(key) || seen.has(key)) continue
      seen.add(key)

      if (ctx.limit && opened >= ctx.limit) return
      opened++

      // Карта сайта отдаёт http:// и без www — приводим к рабочему адресу,
      // иначе каждый запрос стоит лишнего редиректа.
      const pageUrl = `${ORIGIN}${new URL(match[1].trim()).pathname}`
      const html = await fetchText(pageUrl, { referer: `${ORIGIN}/catalog1c/` })
      if (!html) continue

      const images = [...html.matchAll(FULL_IMAGE)].map((m) => ({
        url: `${ORIGIN}${m[1]}`,
        referer: pageUrl,
      }))
      if (images.length === 0) continue

      yield { article, pageUrl, images }
    }
  },
}
