/**
 * Публикация сайта: собрать и залить только то, что изменилось.
 *
 *   npm run publish -- --dry           посмотреть план, ничего не делая
 *   npm run publish -- --to ../proba   залить в локальную папку (проверка)
 *   npm run publish                    залить на хостинг
 *
 * Один раз, на сайте, выложенном руками:
 *   npm run publish -- --skip-build --assume-published
 *
 * ── Почему пересборка полная, а заливка выборочная ──
 *
 * Сперва задумывалась адресная пересборка: поправил цену одного товара
 * — пересобралась одна страница. Так не выйдет: `output: 'export'` у
 * Next собирает весь сайт целиком, частичной сборки там нет. Обещать
 * минуту вместо двадцати было бы враньём.
 *
 * Зато заливать всё целиком незачем. Из 54 тысяч файлов правка одной
 * цены меняет десяток: саму карточку, страницы марки и модели, файл
 * каталога. Остальные байт в байт те же. Скрипт сравнивает отпечатки с
 * прошлой выкладкой и отправляет только разницу — вместо 1,5 ГБ уходит
 * несколько мегабайт.
 *
 * ── Почему отметка «опубликовано» ставится последней ──
 *
 * Если пометить правки опубликованными до заливки и заливка упадёт,
 * они исчезнут из очереди, а на сайте их не будет. Владелец при этом
 * будет уверен, что всё на месте. Поэтому отметка — самый последний
 * шаг, после подтверждённой заливки.
 *
 * ── Сервер разработки должен быть остановлен ──
 *
 * Скрипт пишет в базу, а PGlite держит один процесс. Подробности — в
 * src/db/client.ts.
 */
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'

const DRY = process.argv.includes('--dry')
const SKIP_BUILD = process.argv.includes('--skip-build')

/**
 * Считать нынешнюю выгрузку уже залитой.
 *
 * Нужен ровно один раз. Сайт выложен руками, целым архивом, и
 * отпечатков той выкладки нет — без этого флага первая же публикация
 * сочла бы изменившимися все 54 тысячи файлов и отправила 1,3 ГБ
 * заново. Флаг записывает отпечатки текущей папки out как состояние
 * сервера, ничего не заливая.
 *
 * Применять, только если точно известно, что на сервере лежит ровно
 * эта сборка. Ошибка здесь тихая: расхождение не заметят, пока кто-то
 * не откроет страницу, которая не обновилась.
 */
const ASSUME = process.argv.includes('--assume-published')

/** Куда заливать: локальная папка (--to) либо хостинг из окружения. */
const toIndex = process.argv.indexOf('--to')
const LOCAL_TARGET = toIndex === -1 ? null : process.argv[toIndex + 1]

const SSH = process.env.PUBLISH_SSH ?? ''
const REMOTE_DIR = process.env.PUBLISH_PATH ?? ''
/** Файл закрытого ключа, если он лежит не там, где ssh ищет сам. */
const KEY = process.env.PUBLISH_KEY ? ['-i', process.env.PUBLISH_KEY] : []

const OUT = 'out'
const MANIFEST = '.cache/published-manifest.json'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', shell: true, ...options })
  if (result.status !== 0) {
    console.error(`\nШаг не выполнен: ${command} ${args.join(' ')}`)
    process.exit(result.status ?? 1)
  }
}

/** Отпечатки всех файлов выгрузки: путь от корня out → sha1. */
function fingerprint(dir, base = dir, into = {}) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      fingerprint(path, base, into)
    } else {
      // Путь через косую черту всегда: манифест переживает переезд
      // между Windows и Linux, а обратная косая туда не годится.
      const key = relative(base, path).split(sep).join('/')
      into[key] = createHash('sha1').update(readFileSync(path)).digest('hex')
    }
  }
  return into
}

function readManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, 'utf8'))
  } catch {
    // Манифеста нет — значит выкладываем впервые и шлём всё.
    return null
  }
}

function plural(n, one, few, many) {
  const abs = Math.abs(n) % 100
  if (abs >= 11 && abs <= 14) return many
  const last = abs % 10
  if (last === 1) return one
  if (last >= 2 && last <= 4) return few
  return many
}

function human(bytes) {
  if (bytes > 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} МБ`
  return `${Math.round(bytes / 1024)} КБ`
}

function main() {
  if (!SKIP_BUILD) {
    console.log('→ Собираю сайт (это долго, около двадцати минут)\n')
    run('node', ['scripts/build-static.mjs'])
  }

  if (!existsSync(OUT)) {
    console.error(`Нет папки ${OUT}. Сначала соберите сайт: npm run build:static`)
    process.exit(1)
  }

  console.log('\n→ Считаю отпечатки файлов')
  const now = fingerprint(OUT)

  if (ASSUME) {
    mkdirSync('.cache', { recursive: true })
    writeFileSync(MANIFEST, `${JSON.stringify(now, null, 0)}\n`, 'utf8')
    console.log(
      `\nЗаписано как уже опубликованное: ${Object.keys(now).length} файлов.\n` +
        'Ничего не залито. Следующая публикация отправит только изменения.',
    )
    return
  }

  const before = readManifest()

  const changed = []
  const removed = []

  for (const [path, hash] of Object.entries(now)) {
    if (!before || before[path] !== hash) changed.push(path)
  }
  if (before) {
    for (const path of Object.keys(before)) {
      if (!(path in now)) removed.push(path)
    }
  }

  const bytes = changed.reduce((sum, path) => sum + statSync(join(OUT, path)).size, 0)

  if (!before) {
    console.log(`   Первая выкладка: ${Object.keys(now).length} файлов, ${human(bytes)}`)
  } else {
    console.log(
      `   ${changed.length} ${plural(changed.length, 'файл изменился', 'файла изменилось', 'файлов изменилось')}, ` +
        `${human(bytes)}; удалить на сервере: ${removed.length}`,
    )
  }

  if (changed.length === 0 && removed.length === 0) {
    console.log('\nНа сайте уже всё то же самое — заливать нечего.')
    return
  }

  // Первые десять имён — чтобы глазами убедиться, что меняется
  // ожидаемое, а не весь сайт из-за новой сборки Next.
  for (const path of changed.slice(0, 10)) console.log(`     ~ ${path}`)
  if (changed.length > 10) console.log(`     … и ещё ${changed.length - 10}`)

  if (DRY) {
    console.log('\n--dry: ничего не залито и не помечено.')
    return
  }

  if (LOCAL_TARGET) {
    console.log(`\n→ Копирую в ${LOCAL_TARGET}`)
    for (const path of changed) {
      const to = join(LOCAL_TARGET, path)
      mkdirSync(dirname(to), { recursive: true })
      cpSync(join(OUT, path), to)
    }
    for (const path of removed) {
      rmSync(join(LOCAL_TARGET, path), { force: true })
    }
  } else {
    if (!SSH || !REMOTE_DIR) {
      console.error(
        '\nНе задано, куда заливать. Нужны переменные окружения:\n' +
          '  PUBLISH_SSH=пользователь@сервер\n' +
          '  PUBLISH_PATH=~/vashfarkop.ru/public_html\n\n' +
          'Либо проверка на месте: npm run publish -- --to ../proba',
      )
      process.exit(1)
    }
    uploadOverSsh(changed, removed)
  }

  console.log('\n→ Отмечаю правки опубликованными')
  run('npx', ['tsx', 'scripts/mark-published.ts'])

  mkdirSync('.cache', { recursive: true })
  writeFileSync(MANIFEST, `${JSON.stringify(now, null, 0)}\n`, 'utf8')

  console.log('\nГотово. Сайт обновлён.')
}

/**
 * Заливка одним архивом, а не пофайлово.
 *
 * Каждый scp — это отдельное рукопожатие по ssh: на тысяче файлов
 * уходит больше времени на связь, чем на сами данные. Архив
 * распаковывается на месте одной командой.
 *
 * Список файлов передаётся tar через входной поток, а не аргументами:
 * в командной строке Windows предел около 32 тысяч знаков, и на
 * нескольких сотнях путей он кончается.
 */
function uploadOverSsh(changed, removed) {
  const archive = '.cache/publish.tar.gz'
  mkdirSync('.cache', { recursive: true })

  console.log(`\n→ Пакую ${changed.length} файлов`)
  const tar = spawnSync('tar', ['-czf', archive, '-C', OUT, '-T', '-'], {
    input: changed.join('\n'),
    stdio: ['pipe', 'inherit', 'inherit'],
    shell: true,
  })
  if (tar.status !== 0) process.exit(tar.status ?? 1)

  console.log(`   архив ${human(statSync(archive).size)}`)

  console.log(`\n→ Отправляю на ${SSH}`)
  run('scp', [...KEY, archive, `${SSH}:~/publish.tar.gz`])

  console.log('\n→ Распаковываю на сервере')
  // Распаковка поверх: tar заменяет совпавшие файлы и добавляет новые,
  // остального не трогает. Поэтому прежний сайт не стирается — иначе
  // между стиранием и распаковкой посетители видели бы пустоту.
  run('ssh', [...KEY, SSH, `"cd ${REMOTE_DIR} && tar -xzf ~/publish.tar.gz && rm ~/publish.tar.gz"`])

  if (removed.length > 0) {
    console.log(`\n→ Удаляю на сервере ${removed.length} файлов`)
    /*
      Список идёт через входной поток, а не аргументами: после смены
      сборки удалять приходится десятки тысяч файлов, и в командную
      строку Windows (около 32 тысяч знаков) они не входят.
    */
    const rm = spawnSync(
      'ssh',
      [...KEY, SSH, `"cd ${REMOTE_DIR} && tr '\\n' '\\0' | xargs -0 rm -f"`],
      { input: removed.join('\n'), stdio: ['pipe', 'inherit', 'inherit'], shell: true },
    )
    if (rm.status !== 0) process.exit(rm.status ?? 1)
  }

  rmSync(archive, { force: true })
}

main()
