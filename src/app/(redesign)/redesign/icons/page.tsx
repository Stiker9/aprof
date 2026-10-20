import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Выбираем значок подбора — VASHFARKOP',
  robots: { index: false, follow: false },
}

const variants = [
  {
    title: 'Автомобиль с лупой',
    description: 'Подбор под конкретный автомобиль.',
    path: 'M3 13V9L5 4H15L17 9M3 9H15M3 13H10M5 13V16M6 11H7M20 16A5 5 0 1 1 10 16A5 5 0 1 1 20 16M19 20L22 23',
  },
  {
    title: 'Лупа',
    description: 'Лаконичный и привычный знак поиска.',
    path: 'M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10M15 15L21 21',
  },
  {
    title: 'Ползунки',
    description: 'Подбор по характеристикам и цене.',
    path: 'M4 3V7M4 11V21M12 3V13M12 17V21M20 3V7M20 11V21M1 7H7V11H1ZM9 13H15V17H9ZM17 7H23V11H17Z',
  },
  {
    title: 'Автомобиль с галочкой',
    description: 'Акцент на совместимости с машиной.',
    path: 'M3 14V10L5 4H17L19 10V12M3 10H19M3 14H10M5 14V18M6 12H7M12 17L15 20L22 13',
  },
]

function Icon({ path, large = false }: { path: string; large?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={large ? 'h-16 w-16' : 'h-[18px] w-[18px] shrink-0'}
    >
      <path d={path} />
    </svg>
  )
}

export default function IconOptionsPage() {
  return (
    <main className="min-h-screen bg-paper px-5 pb-20 pt-28 text-ink-dark sm:px-8 lg:px-14">
      <div className="mx-auto max-w-6xl">
        <Link href="/redesign" className="text-sm text-accent underline underline-offset-4">
          ← Копия главной
        </Link>
        <h1 className="mt-7 text-3xl font-semibold sm:text-4xl">Выбираем значок «Подбор»</h1>
        <p className="mt-3 max-w-2xl text-base text-ink-dim">
          Четыре варианта в одном стиле. Слева — обычное состояние, справа — подсветка.
          Наведите курсор на тёмную кнопку или выделите её клавишей Tab.
        </p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {variants.map((variant, index) => (
            <section key={variant.title} className="overflow-hidden rounded-xl border border-line-light bg-white">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-sm font-semibold text-ink-dim">ВАРИАНТ 0{index + 1}</span>
                  <span className="text-accent"><Icon path={variant.path} large /></span>
                </div>
                <h2 className="mt-5 text-xl font-semibold">{variant.title}</h2>
                <p className="mt-2 text-sm text-ink-dim">{variant.description}</p>
              </div>
              <div className="grid grid-cols-2 bg-[#181a1d]">
                <button
                  type="button"
                  aria-label={`Проверить подсветку: ${variant.title}`}
                  className="group flex min-h-[72px] items-center justify-center gap-1.5 text-sm text-white transition-colors duration-150 hover:bg-accent focus-visible:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-white"
                >
                  <span className="text-accent transition-colors duration-150 group-hover:text-white group-focus-visible:text-white">
                    <Icon path={variant.path} />
                  </span>
                  Подбор
                </button>
                <div className="flex min-h-[72px] items-center justify-center gap-1.5 bg-accent text-sm text-white">
                  <Icon path={variant.path} />
                  Подбор
                </div>
              </div>
              <div className="grid grid-cols-2 py-3 text-center text-xs text-ink-dim">
                <span>Обычный / наведите курсор</span>
                <span>При наведении</span>
              </div>
            </section>
          ))}
        </div>
        <p className="mt-7 text-sm text-ink-dim">Назовите номер понравившегося варианта — заменим значок в меню копии.</p>
      </div>
    </main>
  )
}
