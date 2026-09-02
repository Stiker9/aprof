import sharp from 'sharp'
import { expect, test } from 'vitest'
import { probe } from './core/classify'

/** Белый лист с плоскими серыми фигурами — так устроен чертёж сборки. */
async function drawing(): Promise<Buffer> {
  const w = 600
  const h = 400
  const raw = Buffer.alloc(w * h * 3, 255)
  const paint = (x0: number, y0: number, x1: number, y1: number, tone: number) => {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * w + x) * 3
        raw[i] = tone
        raw[i + 1] = tone
        raw[i + 2] = tone
      }
    }
  }
  paint(80, 180, 520, 230, 120)
  paint(150, 120, 190, 180, 90)
  paint(410, 120, 450, 180, 90)
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

/**
 * Белый лист с вырезанной фотографией посередине.
 *
 * Именно на таком классификатор и попался в первой версии: белого на
 * нём столько же, сколько на чертеже, а цвет размазан тем же белым.
 * Ловится он по числу цветов и энтропии.
 */
async function cutoutPhoto(): Promise<Buffer> {
  const w = 600
  const h = 400
  const raw = Buffer.alloc(w * h * 3, 255)
  let seed = 7
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    // Берём старшие биты: младшие у такого генератора почти не меняются,
    // и «шум» из них выходит настолько ровный, что сходит за чертёж.
    return (seed >> 16) & 0xff
  }
  for (let y = 120; y < 300; y++) {
    for (let x = 120; x < 480; x++) {
      const i = (y * w + x) * 3
      raw[i] = next()
      raw[i + 1] = next()
      raw[i + 2] = next()
    }
  }
  return sharp(raw, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

test('плоский чертёж на белом опознаётся как чертёж', async () => {
  const result = await probe(await drawing())
  expect(result?.kind).toBe('drawing')
})

test('вырезанная фотография на белом фоне чертежом не считается', async () => {
  const result = await probe(await cutoutPhoto())
  // Белого на ней много — значит решает не белизна, а сложность кадра.
  expect(result!.whiteRatio).toBeGreaterThan(0.35)
  expect(result?.kind).toBe('other')
})

test('битый файл не роняет разбор', async () => {
  expect(await probe(Buffer.from('это не картинка'))).toBeNull()
})
