/**
 * Разделы админки.
 *
 * ── Почему сгруппировано по частоте, а не по разделам сайта ──
 *
 * Привычный порядок — повторить структуру сайта: главная, каталог,
 * услуги, контакты. Но владелец заходит не «в раздел сайта», а с
 * задачей, и задачи у него разной частоты. Заявки он смотрит
 * ежедневно, цены установки — раз в полгода. Если они стоят рядом,
 * ежедневное приходится каждый раз выискивать среди редкого.
 *
 * Поэтому сверху то, что открывают каждый день, ниже — то, что раз в
 * месяц, в самом низу — настройки, которые трогают раз в год.
 */

export interface NavItem {
  href: string
  label: string
  /** Короткая подпись под названием — для разделов, чьё имя неочевидно. */
  hint?: string
  /** Раздел ещё не сделан: показываем, но не ведём. */
  soon?: boolean
  /** Показывать число новых заявок. */
  badge?: 'requests'
}

export interface NavGroup {
  title: string
  items: NavItem[]
}

export const NAV: NavGroup[] = [
  {
    title: 'Каждый день',
    items: [
      { href: '/admin', label: 'Сводка' },
      { href: '/admin/zayavki', label: 'Заявки', badge: 'requests' },
      { href: '/admin/tovary', label: 'Товары', hint: 'цены, описания, скрытие' },
    ],
  },
  {
    title: 'Витрина',
    items: [
      { href: '/admin/otzyvy', label: 'Отзывы', hint: 'и средняя оценка' },
      { href: '/admin/akcii', label: 'Акции' },
      { href: '/admin/raboty', label: 'Наши работы', hint: 'фотографии установок' },
    ],
  },
  {
    title: 'Цены и услуги',
    items: [
      { href: '/admin/ustanovka', label: 'Установка', hint: 'прайс на работы' },
      { href: '/admin/elektrika', label: 'Электрика' },
      { href: '/admin/voprosy', label: 'Вопросы и ответы' },
    ],
  },
  {
    title: 'Настройки',
    items: [
      { href: '/admin/kontakty', label: 'Контакты', hint: 'телефон, адрес, реквизиты' },
      { href: '/admin/publikacii', label: 'Публикации', hint: 'что ушло на сайт' },
      { href: '/admin/parol', label: 'Пароль' },
    ],
  },
]
