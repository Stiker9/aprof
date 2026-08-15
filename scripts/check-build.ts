import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * Проверяет сгенерированный HTML.
 *
 * Тесты покрывают запросы и форматирование, но не отвечают на вопрос
 * «получилась ли страница правильной». Здесь проверяется результат:
 * есть ли заголовок, канонический адрес, разметка крошек — и столько ли
 * страниц, сколько ожидается.
 */
const ROOT = '.next/server/app'

const EXPECTED: Record<string, number> = {
  Марки: 106,
  Модели: 956,
  Кузова: 1368,
  Товары: 5808,
}

/** Собирает пути ко всем .html на заданной глубине вложенности. */
function collect(dir: string, depth: number, current = 0): string[] {
  const full = path.join(ROOT, dir)
  let entries: string[]
  try {
    entries = readdirSync(full)
  } catch {
    return []
  }

  const found: string[] = []
  for (const entry of entries) {
    const child = path.join(full, entry)
    if (statSync(child).isDirectory()) {
      found.push(...collect(path.join(dir, entry), depth, current + 1))
    } else if (entry.endsWith('.html') && current === depth) {
      found.push(child)
    }
  }
  return found
}

function main() {
  let failed = false

  const counts: Record<string, string[]> = {
    Марки: collect('farkopy', 0),
    Модели: collect('farkopy', 1),
    Кузова: collect('farkopy', 2),
    Товары: collect('tovar', 0),
  }

  console.log('Количество страниц:')
  let total = 0
  for (const [label, expected] of Object.entries(EXPECTED)) {
    const actual = counts[label].length
    total += actual
    const ok = actual === expected
    if (!ok) failed = true
    console.log(
      `  ${label.padEnd(10)} ${String(actual).padStart(5)} из ${expected}${ok ? '' : '  ← НЕ СХОДИТСЯ'}`,
    )
  }
  console.log(`  ${'ИТОГО'.padEnd(10)} ${String(total).padStart(5)} из 8238`)
  if (total !== 8238) failed = true

  console.log('')
  console.log('Проверка разметки на выборке:')

  const samples = [
    ...counts['Кузова'].slice(0, 2),
    ...counts['Товары'].slice(0, 2),
    ...counts['Модели'].slice(0, 1),
    ...counts['Марки'].slice(0, 1),
  ]

  let markupProblems = 0
  for (const file of samples) {
    const html = readFileSync(file, 'utf8')
    const checks: [string, boolean][] = [
      ['заголовок h1', html.includes('<h1')],
      ['title', /<title>[^<]+<\/title>/.test(html)],
      ['разметка BreadcrumbList', html.includes('BreadcrumbList')],
      ['канонический адрес', html.includes('rel="canonical"')],
      ['lang="ru"', html.includes('lang="ru"')],
      ['нет следов заглушки', !html.includes('Create Next App')],
    ]
    const bad = checks.filter(([, ok]) => !ok)
    if (bad.length > 0) {
      failed = true
      markupProblems++
      console.log(`  ${file}`)
      bad.forEach(([name]) => console.log(`      нет: ${name}`))
    }
  }
  if (markupProblems === 0) console.log(`  проверено ${samples.length} страниц, нарушений нет`)

  if (failed) {
    console.log('')
    console.log('ПРОВЕРКА НЕ ПРОЙДЕНА')
    process.exit(1)
  }
}

main()
