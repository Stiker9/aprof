import localFont from 'next/font/local'

/**
 * Шрифты сайта и админки — одни и те же файлы.
 *
 * Вынесены из макета, потому что корневых макетов стало два: сайт и
 * админка лежат в разных группах маршрутов и каждая объявляет свои
 * `<html>` и `<body>`. Пути в `next/font/local` считаются от файла, где
 * вызван localFont, — продублированные в двух макетах, они разъехались
 * бы при первом же переносе папки.
 *
 * Шрифты берутся из пакетов Fontsource и раздаются со своего домена.
 *
 * Подключать их через next/font/google нельзя: машина сборки не имеет
 * доступа к fonts.googleapis.com, сборка падает. Внешние CDN в этом
 * проекте не используются и по соображениям скорости — обращение
 * к чужому хосту задерживает первую отрисовку.
 *
 * Наборов обязательно два — кириллица И латиница. Долгое время был
 * подключён только кириллический файл, а цифр, латинских букв и знаков
 * препинания в нём нет: браузер брал их из системного шрифта, и в одной
 * строке оказывались два разных начертания. Заметно это было на числах —
 * «12 лет» и «2 года» на странице «О нас», где цифра и слово выглядели
 * набранными разными шрифтами, и в заголовке «С 2014 года».
 *
 * Расширенные наборы (cyrillic-ext, latin-ext, vietnamese) не берём:
 * это ещё четыре запроса ради символов, которых на сайте нет.
 */
export const display = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/unbounded/files/unbounded-cyrillic-wght-normal.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-display',
  display: 'swap',
  weight: '300 900',
})

export const body = localFont({
  src: [
    {
      path: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-latin-wght-normal.woff2',
      style: 'normal',
    },
    {
      path: '../../node_modules/@fontsource-variable/wix-madefor-text/files/wix-madefor-text-cyrillic-wght-normal.woff2',
      style: 'normal',
    },
  ],
  variable: '--font-body',
  display: 'swap',
  weight: '400 800',
})

/** Готовая строка классов для `<html>`: обе переменные шрифтов. */
export const fontVariables = `${display.variable} ${body.variable}`
