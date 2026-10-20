/**
 * Даты в админке — словами, а не числами.
 *
 * «Сегодня, 14:20» вместо «15.10.2026 14:20». Владелец смотрит заявки
 * каждый день, и ему важно не число, а «это только что» или «это
 * позавчера, уже остыло».
 *
 * ── Почему вручную, а не toLocaleString ──
 *
 * Разметка считается на сервере, а «сегодня» зависит от часового пояса
 * того, кто смотрит. Браузер тут не поможет: отдай ему разные строки
 * при отрисовке и при оживлении — React сообщит о расхождении.
 *
 * Поэтому пояс задан явно и один: Москва. Мастерская в Петербурге,
 * заявки приходят оттуда же, и «сегодня» для всех означает московское
 * сегодня — включая владельца, если он смотрит заявки из отпуска.
 */
const TZ = 'Europe/Moscow'

const MONTHS = [
  'января',
  'февраля',
  'марта',
  'апреля',
  'мая',
  'июня',
  'июля',
  'августа',
  'сентября',
  'октября',
  'ноября',
  'декабря',
]

/** Год-месяц-день в московском поясе. */
function parts(date: Date): { y: number; m: number; d: number; hh: string; mm: string } {
  // Форматировщик с явным поясом — единственный способ получить
  // «московные» сутки, не прибавляя смещение руками: оно меняется по
  // решению законодателя, а не по формуле.
  const fmt = new Intl.DateTimeFormat('ru-RU', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const found: Record<string, string> = {}
  for (const part of fmt.formatToParts(date)) found[part.type] = part.value

  return {
    y: Number(found.year),
    m: Number(found.month),
    d: Number(found.day),
    hh: found.hour ?? '00',
    mm: found.minute ?? '00',
  }
}

/**
 * «Сегодня, 14:20», «вчера, 09:05», «3 октября, 18:40».
 *
 * Год добавляется только если он не нынешний: «3 октября 2025».
 */
export function formatWhen(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso

  const then = parts(date)
  const today = parts(now)
  const time = `${then.hh}:${then.mm}`

  if (then.y === today.y && then.m === today.m && then.d === today.d) {
    return `сегодня, ${time}`
  }

  const yesterday = parts(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  if (then.y === yesterday.y && then.m === yesterday.m && then.d === yesterday.d) {
    return `вчера, ${time}`
  }

  const year = then.y === today.y ? '' : ` ${then.y}`
  return `${then.d} ${MONTHS[then.m - 1]}${year}, ${time}`
}
