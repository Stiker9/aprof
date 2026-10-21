import type { Metadata } from 'next'
import Link from 'next/link'
import { absolute, urls } from '@/catalog/urls'
import { CatalogShell } from '@/components/catalog/shell'
import Image from 'next/image'
import { BLOG_TOPICS } from '@/content/blog-topics'
import { blogUrl, POSTS } from '@/content/blog/posts'

export const metadata: Metadata = {
  title: 'Блог о фаркопах и буксировке',
  description:
    'Статьи о выборе фаркопа, типах шара, подключении электрики и буксировке прицепа: масса прицепа, нагрузка на шар, документы.',
  alternates: { canonical: absolute('/blog') },
}

/**
 * Блог.
 *
 * Сверху — вышедшие статьи, ниже — темы, которые ещё в работе. Темы
 * без ссылок: выдуманные адреса дали бы битые ссылки, а поисковику —
 * обещание содержимого, которого нет. Тема уходит из списка «скоро»,
 * как только у неё появляется статья с тем же заголовком.
 */

const UPCOMING = BLOG_TOPICS.filter((topic) => !POSTS.some((post) => post.title === topic))

export default function BlogPage() {
  return (
    <CatalogShell
      picker={false}
      crumbs={[{ label: 'Главная', href: urls.home() }, { label: 'Блог' }]}
      title="Блог"
      summary="Разбираем выбор фаркопа, установку и буксировку — с цифрами и без воды."
    >
      <div className="mt-12 grid gap-x-6 gap-y-12 md:grid-cols-2">
        {POSTS.map((post) => (
          <article key={post.slug} className="group flex flex-col">
            <Link
              href={blogUrl(post.slug)}
              tabIndex={-1}
              aria-hidden="true"
              className="relative block aspect-[16/9] overflow-hidden rounded-[var(--radius-block)] bg-paper-2"
            >
              <Image
                src={post.image}
                alt=""
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              />
            </Link>
            <p className="mt-6 text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
              {post.category}
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(22px,1.9vw,28px)] leading-[1.12] tracking-[-0.02em]">
              <Link href={blogUrl(post.slug)} className="hover:text-accent">
                {post.title}
              </Link>
            </h2>
            <p className="mt-4 text-[15px] leading-[1.6] opacity-75">{post.excerpt}</p>
          </article>
        ))}
      </div>

      <div className="mt-16 max-w-[70ch]">
        <h2 className="text-[19px] font-medium">Скоро</h2>
        <ul className="mt-5">
          {UPCOMING.map((topic) => (
            <li key={topic} className="border-b border-line-light py-4 text-[17px] opacity-75">
              {topic}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-5 rounded-[var(--radius-card)] border border-line-light bg-white px-8 py-7">
        <div className="flex-1">
          <h2 className="text-[19px] font-medium">Вопрос не ждёт статьи?</h2>
          <p className="mt-2 max-w-[52ch] text-sm opacity-75">
            Ответы на самое частое уже собраны, а на остальное ответим по телефону.
          </p>
        </div>
        <Link href={urls.catalog()} className="text-accent hover:underline">
          Частые вопросы →
        </Link>
      </div>
    </CatalogShell>
  )
}
