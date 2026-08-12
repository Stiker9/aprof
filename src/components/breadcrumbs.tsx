import Link from 'next/link'
import { absolute } from '@/catalog/urls'

export interface Crumb {
  label: string
  href?: string
}

/**
 * Хлебные крошки вместе с разметкой BreadcrumbList.
 *
 * Разметка обязательна: Яндекс выводит крошки прямо в сниппете,
 * это заметно поднимает кликабельность. Последний элемент — текущая
 * страница, у неё ссылки нет.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: absolute(item.href) } : {}),
    })),
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Хлебные крошки" className="flex flex-wrap items-center gap-2 text-sm">
        {items.map((item, index) => (
          <span key={item.label} className="flex items-center gap-2">
            {index > 0 && <span className="text-ink-dim">→</span>}
            {item.href ? (
              <Link href={item.href} className="text-ink-muted hover:text-ink">
                {item.label}
              </Link>
            ) : (
              <span className="text-ink">{item.label}</span>
            )}
          </span>
        ))}
      </nav>
    </>
  )
}
