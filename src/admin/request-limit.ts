/**
 * Ограничение частоты заявок.
 *
 * ── Зачем ──
 *
 * Адрес приёма заявок открыт всему интернету: у посетителя пароля
 * нет. Без ограничения один скрипт за ночь набьёт в таблицу сто тысяч
 * строк, и настоящие заявки утонут среди мусора.
 *
 * ── Почему именно столько ──
 *
 * Пять за час с одного адреса. Больше одной заявки подряд — обычное
 * дело: человек ошибся в номере и отправил снова, или звонят из
 * автосервиса, где у всех один вайфай. А пять за час уже не похоже на
 * покупателя.
 *
 * ── Почему в памяти, а не в базе ──
 *
 * Это не данные, а состояние защиты: в базе оно потребовало бы
 * таблицы, индексов и чистки, а при перезапуске всё равно теряло бы
 * смысл. Перезапуск сервера снимает счётчик — роботу это даёт
 * несколько лишних попыток раз в несколько недель, и ладно.
 *
 * ── Про IP ──
 *
 * Адрес используется только для счёта и в базу не попадает. Хранить
 * его рядом с заявкой значит собирать о человеке больше, чем он
 * оставил сам.
 */

const MAX_PER_HOUR = 5
const WINDOW_MS = 60 * 60 * 1000

/**
 * Состояние на globalThis: в разработке Next перезагружает модули на
 * каждую правку, и обычная переменная обнулялась бы вместе со счётчиком.
 */
const store = globalThis as typeof globalThis & {
  __vashfarkopRequestTimes?: Map<string, number[]>
}

function times(): Map<string, number[]> {
  store.__vashfarkopRequestTimes ??= new Map()
  return store.__vashfarkopRequestTimes
}

/** Свежие отметки этого адреса, старше часа — выбрасываются. */
function recent(ip: string): number[] {
  const since = Date.now() - WINDOW_MS
  const fresh = (times().get(ip) ?? []).filter((at) => at > since)

  if (fresh.length === 0) times().delete(ip)
  else times().set(ip, fresh)

  return fresh
}

export function tooManyRequests(ip: string): boolean {
  return recent(ip).length >= MAX_PER_HOUR
}

export function noteRequest(ip: string): void {
  /*
    Карта чистится здесь же, а не по расписанию: отдельный таймер в
    серверном процессе пришлось бы заводить и останавливать, а без
    чистки карта росла бы адресами, которые заходили однажды.
  */
  if (times().size > 5000) {
    const since = Date.now() - WINDOW_MS
    for (const [key, stamps] of times()) {
      if (stamps.every((at) => at <= since)) times().delete(key)
    }
  }

  times().set(ip, [...recent(ip), Date.now()])
}
