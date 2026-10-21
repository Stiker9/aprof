import Image from 'next/image'
import Link from 'next/link'
import { BLOG_TOPICS } from '@/content/blog-topics'
import { blogUrl, POSTS } from '@/content/blog/posts'
import { Section } from '@/components/ui/section'

/**
 * Блог на главной.
 *
 * Вид — журнальный, как у Brink и других производителей: две карточки
 * в ряд, широкая и узкая, крупное фото, заголовок, пара строк и кнопка
 * «Читать». Белый фон отделяет блок от тёмных вопросов над ним и серых
 * контактов под ним.
 *
 * Карточка ведёт на статью, если та уже вышла, — её находят в списке
 * статей по заголовку. Пока статьи нет, кнопка ведёт в раздел блога,
 * а на фото стоит плашка «Скоро»: ссылка на несуществующую страницу
 * была бы битой, а муляж не должен выдавать себя за готовый материал.
 */
/*
  Широкая карточка слева — вышедшая статья: она главная в блоке,
  узкая справа — тема, которая ещё в работе.
*/
const FEATURED = [
  {
    title: BLOG_TOPICS[4],
    category: 'Буксировка',
    excerpt:
      'Где в ПТС искать допустимую массу прицепа, чем она отличается от нагрузки на шар и почему лодку с прицепом стоит взвесить заранее.',
    image: '/images/blog/massa-pricepa.webp',
    dim: true,
    position: '50% 50%',
    wide: true,
  },
  {
    title: BLOG_TOPICS[0],
    category: 'Выбор фаркопа',
    excerpt:
      'Шар A, C или F — от этого зависит, какие прицепы и багажники вы сможете возить и придётся ли снимать фаркоп на мойке. Разбираем на примерах.',
    image: '/images/blog/tipy-sharov-farkopa.webp',
    dim: true,
    position: '50% 50%',
    wide: false,
  },
]

function postHref(title: string): string | undefined {
  const post = POSTS.find((p) => p.title === title)
  return post && blogUrl(post.slug)
}

export function Blog() {
  return (
    <Section tone="white" id="blog" className="scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          {/* «Блог» — главное слово блока, остальное тише и служит фоном к нему. */}
          <h2 className="font-[family-name:var(--font-display)] text-[clamp(40px,4.4vw,64px)] leading-[0.95] tracking-[-0.035em]">
            Блог
          </h2>
          <p className="mt-5 max-w-[46ch] text-[clamp(18px,1.7vw,24px)] leading-[1.35] tracking-[-0.01em] opacity-65">
            Полезное о фаркопах: разбираем выбор, установку и буксировку без воды
          </p>
        </div>

        <Link
          href="/blog"
          className="group inline-flex items-center gap-2 text-[15px] font-medium text-accent"
        >
          Все статьи
          <span className="transition-transform group-hover:translate-x-1">→</span>
        </Link>
      </div>

      <div className="mt-12 grid gap-x-6 gap-y-14 lg:grid-cols-12">
        {FEATURED.map((post) => {
          const href = postHref(post.title)
          return (
            <article
              key={post.title}
              className={`group flex flex-col ${post.wide ? 'lg:col-span-7' : 'lg:col-span-5'}`}
            >
              <Link
                href={href ?? '/blog'}
                tabIndex={-1}
                aria-hidden="true"
                className="relative block h-[clamp(240px,26vw,420px)] overflow-hidden rounded-[var(--radius-block)] bg-paper-2"
              >
                <Image
                  src={post.image}
                  alt=""
                  fill
                  sizes={
                    post.wide
                      ? '(min-width: 1024px) 58vw, 100vw'
                      : '(min-width: 1024px) 42vw, 100vw'
                  }
                  style={{ objectPosition: post.position }}
                  className={`object-cover transition duration-700 ease-out group-hover:scale-[1.04] ${post.dim ? 'brightness-[0.82] saturate-[0.95] group-hover:brightness-[0.9]' : ''}`}
                />
                {!href && (
                  <span className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-dark backdrop-blur">
                    Скоро
                  </span>
                )}
              </Link>

              <p className="mt-7 text-[11px] font-medium uppercase tracking-[0.24em] text-accent">
                {post.category}
              </p>
              <h3 className="mt-3 max-w-[30ch] font-[family-name:var(--font-display)] text-[clamp(22px,1.9vw,28px)] leading-[1.12] tracking-[-0.02em]">
                {post.title}
              </h3>
              <p className="mt-4 max-w-[62ch] text-[15px] leading-[1.6] opacity-65">
                {post.excerpt}
              </p>

              <Link
                href={href ?? '/blog'}
                className="mt-7 inline-flex w-fit items-center gap-2.5 rounded-full border border-accent px-6 py-3 text-[15px] font-medium text-accent transition-colors hover:bg-accent hover:text-white"
              >
                <span aria-hidden="true">›</span>
                Читать
                <span className="sr-only">: {post.title}</span>
              </Link>
            </article>
          )
        })}
      </div>
    </Section>
  )
}
