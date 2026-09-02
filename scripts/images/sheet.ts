/**
 * Контактный лист: все собранные картинки одной страницей.
 *
 * Классификатор уверенно отличает только чертёж. Всё остальное —
 * рекламные плашки заводов и фотографии на машине — он в одну кучу и
 * сваливает, потому что по доле белого и насыщенности они не
 * различаются. Разбирать эту кучу должен человек: на фотографии в кадр
 * попадают чужие номера, рамки номера с телефонами автосалонов и
 * вывески, и увидеть это может только глаз.
 *
 * Поэтому лист печатает всё: и то, что уже выложено, и то, что ждёт.
 * Выложенное тоже надо просматривать — чертёж с чужим знаком остался бы
 * чертежом и прошёл бы автоматику насквозь.
 *
 *   npx tsx scripts/images/sheet.ts        — всё
 *   npx tsx scripts/images/sheet.ts --wait — только ожидающие решения
 *
 * Готовый файл открывается в браузере; отметить годные — правкой
 * approved в data/product-photos.json, после чего generate.ts пересоберёт список.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { readManifest } from './core/store'

// Вне public: это внутренний инструмент, наружу ему не надо.
// Пути к картинкам относительные — лист открывается прямо из файла.
const OUT = '.cache/images-sheet.html'

async function main() {
  const onlyWaiting = process.argv.includes('--wait')
  const manifest = await readManifest()

  const rows = Object.entries(manifest)
    .filter(([, record]) => !onlyWaiting || !record.approved)
    .sort((a, b) => a[1].source.localeCompare(b[1].source) || a[0].localeCompare(b[0]))

  const cells = rows
    .map(
      ([slug, record]) => `<figure class="${record.approved ? 'ok' : 'wait'}">
  <img src="../public/images/products/${record.file}" alt="" loading="lazy">
  <figcaption>
    <b>${record.article}</b>
    <span>${record.source} · ${record.kind === 'drawing' ? 'чертёж' : 'не чертёж'}</span>
    <a href="${record.page}" target="_blank" rel="noopener">страница завода</a>
  </figcaption>
</figure>`,
    )
    .join('\n')

  const waiting = rows.filter(([, r]) => !r.approved).length

  const html = `<!doctype html>
<meta charset="utf-8">
<title>Картинки товаров — контактный лист</title>
<style>
  body { margin: 0; padding: 24px; font: 13px/1.4 system-ui, sans-serif; background: #f7f6f4; color: #141416 }
  h1 { font-size: 20px; margin: 0 0 4px }
  p.lead { margin: 0 0 20px; color: #5c5c5a }
  .grid { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)) }
  figure { margin: 0; background: #fff; border: 1px solid #e7e5e1; border-radius: 10px; overflow: hidden }
  figure.wait { border-color: #d93a2b; box-shadow: 0 0 0 1px #d93a2b inset }
  img { display: block; width: 100%; height: 150px; object-fit: contain; background: #fff }
  figcaption { padding: 8px 10px; border-top: 1px solid #efedea; display: flex; flex-direction: column; gap: 2px }
  figcaption span { color: #5c5c5a; font-size: 12px }
  figcaption a { color: #d93a2b; font-size: 12px }
</style>
<h1>Картинки товаров — ${rows.length} шт.</h1>
<p class="lead">Красной рамкой отмечено то, что не выложено на сайт и ждёт просмотра: ${waiting} шт.
Чтобы выложить — поставить <code>"approved": true</code> в data/product-photos.json и запустить generate.ts.</p>
<div class="grid">
${cells}
</div>
`

  await mkdir('.cache', { recursive: true })
  await writeFile(OUT, html, 'utf8')
  console.log(`${OUT}: ${rows.length} картинок, ждут просмотра ${waiting}`)
}

void main()
