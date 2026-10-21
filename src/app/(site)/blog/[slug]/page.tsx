import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { absolute, urls } from '@/catalog/urls'
import { ArticleToc } from '@/components/blog/article-toc'
import { CatalogShell } from '@/components/catalog/shell'
import { CONTACTS } from '@/content/contacts'
import { blogUrl, getPost, POSTS } from '@/content/blog/posts'

interface Params {
  params: Promise<{ slug: string }>
}

export function generateStaticParams() {
  return POSTS.map((post) => ({ slug: post.slug }))
}

/* Только статьи из списка: для статической выгрузки чужой адрес — 404, а не попытка собрать страницу. */
export const dynamicParams = false

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}

  return {
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: absolute(blogUrl(post.slug)) },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.description,
      url: absolute(blogUrl(post.slug)),
      publishedTime: post.published,
      images: [{ url: absolute(post.image), alt: post.imageAlt }],
    },
  }
}

const dateFormat = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Статья блога.
 *
 * Текст набирается узкой колонкой в 70 знаков — длиннее строка читается
 * тяжело. Оформление тегов внутри статьи задано здесь одним классом
 * `article`, а не в каждом абзаце: текст статьи остаётся чистой
 * разметкой, и новую статью можно написать, не думая о вёрстке.
 *
 * Разметка Article и FAQPage помогает поисковикам и их нейроответам
 * понять, где в статье ответ и чей он.
 */
export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const { Body } = post

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      image: absolute(post.image),
      datePublished: post.published,
      mainEntityOfPage: absolute(blogUrl(post.slug)),
      publisher: {
        '@type': 'Organization',
        name: 'VASHFARKOP',
        url: absolute(urls.home()),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: post.faq.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    },
  ]

  return (
    <CatalogShell
      picker={false}
      crumbs={[
        { label: 'Главная', href: urls.home() },
        { label: 'Блог', href: '/blog' },
        { label: post.title },
      ]}
      title={post.title}
      summary={
        <>
          <span className="text-accent">{post.category}</span> ·{' '}
          <time dateTime={post.published}>{dateFormat.format(new Date(post.published))}</time>
        </>
      }
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mt-8 grid gap-x-14 gap-y-12 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--radius-block)] bg-paper-2">
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="(min-width: 1280px) 62vw, (min-width: 1024px) 60vw, 100vw"
              className="object-cover"
            />
          </div>

          <article className="article mx-auto mt-12 max-w-[760px]">
            <Body />

            <h2 id="voprosy">Частые вопросы</h2>
            <dl>
              {post.faq.map((item) => (
                <div key={item.question}>
                  <dt>{item.question}</dt>
                  <dd>{item.answer}</dd>
                </div>
              ))}
            </dl>
          </article>

          <div className="mx-auto mt-12 max-w-[760px]">
            <Link href="/blog" className="text-accent hover:underline">
              ← Все статьи
            </Link>
          </div>
        </div>

        {/*
          Боковая колонка липнет под ужатую шапку: оглавление остаётся
          под рукой, пока читают длинный текст. На телефоне колонка уходит
          под статью, а оглавление там не нужно — разделов на экране
          немного, и прокрутка короче самого списка.
        */}
        <aside className="flex flex-col gap-8 lg:sticky lg:top-[calc(var(--header-h-min)+24px)] lg:self-start">
          <div className="hidden lg:block">
            <ArticleToc />
          </div>

          <div className="rounded-[var(--radius-block)] bg-bg p-7 text-ink">
            <h2 className="font-[family-name:var(--font-display)] text-[22px] leading-[1.15] tracking-[-0.02em]">
              Подберём фаркоп под ваш прицеп
            </h2>
            <p className="mt-3 text-[14px] leading-[1.55] opacity-70">
              Отфильтруйте по нагрузке и типу шара или найдите модель под свою машину.
            </p>
            <Link
              href="/podbor"
              className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-accent px-6 py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-accent-hover"
            >
              Подбор по параметрам
            </Link>
            <a
              href={CONTACTS.phoneHref}
              className="mt-4 block text-center text-[15px] opacity-80 transition-opacity hover:opacity-100"
            >
              или позвоните: {CONTACTS.phone}
            </a>
          </div>
        </aside>
      </div>
    </CatalogShell>
  )
}
