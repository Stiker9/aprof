import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { fontVariables } from '@/lib/fonts'
import '../admin.css'

/**
 * Корневой макет админки.
 *
 * ── Почему корневой, а не вложенный в макет сайта ──
 *
 * Сайт объявляет свои `<html>` и `<body>`: тёмный фон, шапку, подвал и
 * общий `zoom: 0.95`. Всё это админке мешает — её обернуло бы шапкой
 * магазина, а таблицы ужало бы до дробных пикселей. Поэтому папки
 * разведены по группам маршрутов `(site)` и `(admin)`, и у каждой свой
 * корень. На адреса группы не влияют.
 *
 * ── Почему `layout.admin.tsx`, а не `layout.tsx` ──
 *
 * Расширение `.admin.tsx` разрешено в next.config.ts только в серверном
 * режиме. При сборке статической выгрузки его в pageExtensions нет, и
 * Next этих файлов просто не видит: в выгрузке админки не существует —
 * не «есть, но не работает». Это важно, потому что она пишет в базу и
 * принимает пароль, а выгрузка уезжает на публичный хостинг.
 *
 * ── Почему noindex ──
 *
 * Запрет индексации — не защита (от неё защищает проверка входа), а
 * гигиена: страница входа в выдаче по запросу «фаркопы спб» не нужна
 * никому.
 */
export const metadata: Metadata = {
  title: 'Панель управления — VASHFARKOP',
  robots: { index: false, follow: false },
}

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ru" className={fontVariables}>
      <body className="bg-paper font-[family-name:var(--font-body)] text-ink-dark">{children}</body>
    </html>
  )
}
