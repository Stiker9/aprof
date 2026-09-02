/**
 * Трейлер — treiler.ru
 *
 * Петербургский завод, выпускает ТСУ с 1991 года; в нашей базе 225 его
 * артикулов. В карточке лежит 3D-рендер изделия на белом — для плитки
 * каталога это лучше фотографии: виден сам товар и ничего лишнего.
 *
 * Каталог на Битриксе, и в адресе товара стоит внутренний номер, а не
 * артикул: /catalog/hitch/6050/. Значит по адресу не сопоставить —
 * приходится обходить страницы списка и брать артикул из заголовка
 * карточки, где он написан как «арт.6050». Иногда номер в адресе с ним
 * совпадает, иногда нет, полагаться на это нельзя.
 *
 * Карты сайта у них нет (sitemap.xml пустой), поэтому список берётся
 * постранично. Обход останавливается, когда очередная страница не
 * добавила ни одной новой ссылки: так число страниц не приходится
 * зашивать в код и оно не устареет.
 *
 * robots.txt закрывает /search, /basket, /order и служебные разделы
 * Битрикса; /catalog открыт (проверено 02.09.2026).
 */
import { fetchText } from '../core/http'
import { articleKey } from '../core/match'
import type { DiscoverContext, Source, SourceProduct } from '../core/types'

const ORIGIN = 'http://treiler.ru'
const LIST = `${ORIGIN}/catalog/hitch/`

const PRODUCT_LINK = /href="(\/catalog\/hitch\/(\d+)\/)"/g

/** «Фаркоп Трейлер Ford Ranger бортовой с 2011г.в. арт.6050» */
const TITLE_ARTICLE = /<title>[^<]*?арт\.\s*([^\s<,;]+)/i

/** Кадры галереи товара; у соседних блоков («Аналог кованного шара») класса нет. */
const GALLERY = /product-detail-gallery__picture[^>]*?data-src="([^"]+)"/g

/**
 * Битрикс отдаёт в разметке уменьшенную копию:
 *   /upload/resize_cache/iblock/088/450_450_<хеш>/имя.jpeg
 * Оригинал лежит на два уровня выше:
 *   /upload/iblock/088/имя.jpeg
 */
function originalPath(resized: string): string {
  return resized.replace('/resize_cache/', '/').replace(/\/\d+_\d+_[^/]*\//, '/')
}

export const treiler: Source = {
  id: 'treiler',
  site: ORIGIN,
  manufacturers: ['Трейлер'],

  async *discover(ctx: DiscoverContext): AsyncGenerator<SourceProduct> {
    const pages: string[] = []
    const seenLinks = new Set<string>()

    for (let page = 1; page <= 60; page++) {
      const url = page === 1 ? LIST : `${LIST}?PAGEN_1=${page}`
      const html = await fetchText(url, { referer: ORIGIN })
      if (!html) break

      let added = 0
      for (const match of html.matchAll(PRODUCT_LINK)) {
        const path = match[1]
        if (seenLinks.has(path)) continue
        seenLinks.add(path)
        pages.push(`${ORIGIN}${path}`)
        added++
      }
      if (added === 0) break
    }

    console.log(`  Трейлер: в списке ${pages.length} карточек`)

    const seen = new Set<string>()
    let opened = 0

    for (const pageUrl of pages) {
      if (ctx.limit && opened >= ctx.limit) return
      const html = await fetchText(pageUrl, { referer: LIST })
      if (!html) continue

      const found = html.match(TITLE_ARTICLE)
      if (!found) continue
      const article = found[1].trim()
      const key = articleKey(article)
      if (!ctx.needed.has(key) || seen.has(key)) continue
      seen.add(key)
      opened++

      const images = [...html.matchAll(GALLERY)].map((m) => ({
        url: `${ORIGIN}${originalPath(m[1])}`,
        referer: pageUrl,
      }))
      if (images.length === 0) continue

      yield { article, pageUrl, images }
    }
  },
}
