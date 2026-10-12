import type { MetadataRoute } from 'next'
import { absolute } from '@/catalog/urls'

/*
  Обязательно для статической выгрузки: без этой строки Next считает
  маршрут динамическим и отказывается собирать сайт в папку с файлами
  («export const dynamic not configured on route»). Содержимое здесь и
  так не зависит от запроса — оно одинаково для всех.
*/
export const dynamic = 'force-static'


export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: absolute('/sitemap.xml'),
  }
}
