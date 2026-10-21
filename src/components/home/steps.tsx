import Link from 'next/link'

/**
 * Как проходит заказ.
 *
 * Четыре шага от «выбрал» до «забрал». Блок отвечает на вопрос, который
 * человек задаёт до звонка: сколько раз придётся приезжать и что будет
 * происходить. У нас установка идёт без записи в приёмные часы, но
 * об этом нигде не сказано подряд — только разрозненными фразами.
 *
 * Цифры шагов набраны крупно и красным: это единственный акцент на
 * тёмной секции, и он ведёт глаз сверху вниз.
 */
const STEPS = [
  {
    title: 'Подбираете фаркоп',
    text: 'По марке, модели и кузову в каталоге — или звонком, если машины нет в списке.',
  },
  {
    title: 'Согласуем комплект',
    text: 'Электрика, блок согласования, нужен ли вырез бампера. Называем точную сумму до работы.',
  },
  {
    title: 'Приезжаете на установку',
    text: 'Около трёх часов на 1-й Жерновской. Запись не нужна — работаем в приёмные часы.',
  },
  {
    title: 'Забираете с документами',
    text: 'Сертификат на фаркоп, документы для ТО и гарантия на работы два года.',
  },
]

export function Steps() {
  return (
    <section className="border-t border-white/8 bg-surface text-ink">
      <div className="px-5 py-12 sm:px-8 sm:py-14 lg:px-14 lg:py-[clamp(44px,5.5vh,72px)]">
        <div className="flex flex-wrap items-end justify-between gap-x-12 gap-y-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-muted">
              Как это работает
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-display)] text-[clamp(27px,2.8vw,37px)] leading-[1.02] tracking-[-0.025em]">
              От подбора до документов
            </h2>
          </div>
          <p className="max-w-[38ch] text-[15px] leading-[1.55] text-ink-muted">
            Никаких «приезжайте ещё раз за электрикой»: фаркоп, подключение и бумаги — за один заезд.
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex flex-col gap-3 border-t border-white/12 pt-5">
              <span className="font-[family-name:var(--font-display)] text-[15px] leading-none text-accent">
                0{index + 1}
              </span>
              <span className="text-[18px] leading-[1.25] tracking-[-0.01em]">{step.title}</span>
              <span className="text-[14px] leading-[1.5] text-ink-muted">{step.text}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/zapis"
            className="inline-flex items-center gap-3 rounded-full bg-accent px-7 py-4 text-[15px] font-semibold text-[#FFF6F4] transition-[filter] hover:brightness-110"
          >
            Записаться на установку <span aria-hidden>→</span>
          </Link>
          <Link
            href="/ustanovka-farkopa"
            className="inline-flex items-center rounded-full border border-white/28 px-6 py-4 text-[15px] transition-colors hover:border-white/60"
          >
            Цены на установку
          </Link>
        </div>
      </div>
    </section>
  )
}
