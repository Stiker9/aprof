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
}

export default nextConfig
