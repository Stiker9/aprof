import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /**
   * PGlite не должен попадать в бандл.
   *
   * Это PostgreSQL, скомпилированный в WebAssembly, и он сам разрешает пути
   * к своим файлам через файловую систему Node. Когда сборщик его упаковывает,
   * разрешение путей ломается: «The "path" argument must be of type string…
   * Received an instance of URL». Пакет должен грузиться как обычный внешний
   * модуль на стороне сервера.
   */
  serverExternalPackages: ['@electric-sql/pglite'],

  experimental: {
    /**
     * Генерация страниц идёт в один процесс.
     *
     * По умолчанию Next.js поднимает воркер на каждое ядро, и все они
     * одновременно открывают одну и ту же файловую базу PGlite. Это
     * однопоточный WebAssembly, конкурентный доступ он не держит и падает
     * с «RuntimeError: Aborted()». Сборка становится дольше, но проходит.
     */
    cpus: 1,
  },

  /**
   * Абсолютный путь к PGlite для ВСЕХ процессов сборки.
   *
   * «Collecting page data» у Next.js — это отдельный дочерний процесс
   * (см. cpus: 1 выше — воркер поднимается всё равно, просто один). Его
   * process.cwd() не гарантированно совпадает с тем, откуда запускался
   * npm run prebuild. Относительный './.pgdata' в src/db/client.ts тогда
   * резолвится в другое место — воркер тихо открывает НОВУЮ пустую базу
   * вместо развёрнутой prebuild-скриптом, и запрос падает с «relation
   * "variants" does not exist», хотя дамп на самом деле развернулся верно.
   *
   * next.config.ts заведомо перезагружается в каждом процессе (это видно
   * в логе сборки: «Running next.config.ts took ...»), и его __dirname —
   * всегда корень проекта, не зависит от cwd воркера. Поэтому путь
   * считаем именно здесь и раздаём через env — так client.ts и
   * restore-data.ts гарантированно смотрят в один и тот же каталог.
   */
  env: {
    PGLITE_PATH: process.env.PGLITE_PATH ?? path.resolve(__dirname, '.pgdata'),
  },
}

export default nextConfig
