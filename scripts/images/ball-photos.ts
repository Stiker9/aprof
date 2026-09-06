/**
 * Снимки шаровых узлов по типу шара.
 *
 *   npx tsx scripts/images/ball-photos.ts
 *
 * Заказчик прислал фотографии узлов, чтобы закрыть карточки, для которых
 * снимка самого изделия нет и взять его неоткуда: у AvtoS, Sheriff и
 * Halty нет сайтов, а в выгрузке поставщика всё заштамповано чужим
 * знаком.
 *
 * Это не снимок конкретного артикула и не претендует им быть — то же
 * обобщённое изображение по типу шара, что стояло рисунком, только
 * фотографией. Поэтому подпись «обобщённое изображение» остаётся и на
 * карточке, и на плитке.
 *
 * ── Откуда какой тип ──
 *
 * A, E и D2 назвал сам заказчик. BA в его подписи — не наш код: у нас
 * такого типа нет. Проверил по базе, а не на глаз: все 25 артикулов,
 * оканчивающихся на «-BA» (TAVIALS), имеют тип шара C, и он описан как
 * «горизонтальный съёмный» — ровно то, что на снимке. Значит BA — это C.
 *
 * Два правила тоже от заказчика: «нет данных по шару — показывать A» и
 * «шар H — показывать A». Он ставит эти изделия каждый день, так что
 * это знание, а не догадка.
 *
 * EA идёт под снимок E по той же причине, по которой шла под рисунок E:
 * это тот же американский квадрат, отличие только в антистуке, и на
 * снимке такого размера его не видно.
 *
 * Исходники лежат в «Загрузках» и в репозиторий не попадают: они большие
 * и нужны один раз. Если заказчик пришлёт ещё типы — положить рядом и
 * дописать строку в SOURCES.
 */
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import sharp from 'sharp'

const FROM = 'C:/Users/Admin/Downloads/Telegram Desktop'
const TO = 'public/images/ball/photo'

/** Тип шара → присланный файл. */
const SOURCES: [ball: string, file: string][] = [
  ['a', 'image_2026-09-06_19-07-32.png'],
  ['e', 'image_2026-09-06_19-07-49.png'],
  ['c', 'image_2026-09-06_19-08-38.png'],
  ['d2', 'image_2026-09-06_19-09-53.png'],
]

async function main() {
  await mkdir(TO, { recursive: true })

  for (const [ball, file] of SOURCES) {
    const src = join(FROM, file)
    if (!existsSync(src)) {
      console.warn(`  ! нет файла: ${src}`)
      continue
    }

    const out = join(TO, `${ball}.webp`)
    await sharp(src)
      // Снимки сняты на белом с широкими полями, у каждого своими.
      // Без обрезки узел в плитке был бы разного размера от типа к типу.
      .trim({ threshold: 12 })
      .flatten({ background: '#ffffff' })
      .resize(720, 720, { fit: 'contain', background: '#ffffff' })
      .webp({ quality: 82 })
      .toFile(out)

    const meta = await sharp(out).metadata()
    console.log(`  ${ball.padEnd(3)} ← ${file}  ${meta.width}×${meta.height}`)
  }

  console.log('')
  console.log(`Готово: ${TO}`)
}

void main()
