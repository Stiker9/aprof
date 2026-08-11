import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Часть тестов поднимает PGlite — настоящий PostgreSQL, скомпилированный
    // в WebAssembly. Запуск экземпляра и накат миграций занимают несколько
    // секунд, поэтому стандартных пяти не хватает.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
