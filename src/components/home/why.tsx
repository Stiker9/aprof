import Link from 'next/link'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/components/ui/section'

/**
 * Почему нам доверяют — вместо прежнего «С 2014 года».
 *
 * Прежний блок состоял из заголовка, одной строки и трёх цифр, которые к
 * этому месту страницы уже дважды показаны: в полосе под первым экраном и
 * в шапке галереи. Отдельной секции он не держал — читался как пустое
 * место с крупным шрифтом.
 *
 * У конкурентов на этом месте не «о нас», а причины: у vsemfarkop —
 * четыре («точный подбор», «один ответственный», «аккуратная работа»,
 * «документы и гарантия»), у farkop.ru — список «каждого клиента ждёт»
 * плюс бренды. Поэтому здесь те же четыре довода, но нашими фактами:
 * подбор по кузову, свой сервис и склад, документы, один визит.
 *
 * Все четыре проверяемы и уже звучат на сайте в других местах — ничего
 * нового не обещаем.
 */
const REASONS = [
  {
    icon: [
      'M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2',
      'M9 17h6',
      'M9 17a2 2 0 1 0-4 0a2 2 0 1 0 4 0',
      'M19 17a2 2 0 1 0-4 0a2 2 0 1 0 4 0',
    ],
    title: 'Подбираем по кузову, а не по модели',
    text: 'У RAV4 за тридцать лет шесть поколений, и крепёж в лонжеронах у них разный. Поэтому третий шаг подбора — кузов и годы, а не «Toyota RAV4».',
  },
  {
    icon: [
      'M22 8.35V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.35a2 2 0 0 1 1.26-1.85l8-3.2a2 2 0 0 1 1.48 0l8 3.2A2 2 0 0 1 22 8.35Z',
      'M6 18h12M6 14h12M6 10h12',
    ],
    title: 'Свой сервис и свой склад',
    text: 'Один адрес на 1-й Жерновской: мастера и склад в одном месте. Без посредников и подрядчиков.',
  },
  {
    icon: [
      'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2Z',
      'M14 2v6h6',
      'M9 15l2 2 4-4',
    ],
    title: 'Документы и гарантия',
    text: 'Сертификат на фаркоп, документы для ТО и два года гарантии на работы. Всё выдаём на руки в день установки.',
  },
  {
    icon: ['M21 12A9 9 0 1 1 3 12A9 9 0 1 1 21 12', 'M12 7v5l3 2'],
    title: 'Один визит, около трёх часов',
    text: 'Записываться заранее не нужно — работаем в приёмные часы. Приезжаете на машине и уезжаете на ней же, с фаркопом и подключённой электрикой.',
  },
]

export function Why() {
  return (
    <Section tone="light">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <Eyebrow>Почему мы</Eyebrow>
          <SectionTitle>Четыре причины поставить у нас</SectionTitle>
        </div>
        <Link
          href="/o-nas"
          className="inline-flex items-center gap-3 rounded-full border border-ink-dark/20 px-6 py-3 text-[15px] font-medium transition-colors hover:border-ink-dark"
        >
          О сервисе <span className="opacity-75" aria-hidden>→</span>
        </Link>
      </div>

      <SectionLead>
        Один сервис на 1-й Жерновской: свои мастера, свой склад и документы на каждую установку.
      </SectionLead>

      <div className="mt-10 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2">
        {REASONS.map((reason) => (
          <div key={reason.title} className="flex flex-col gap-4 border-t border-ink-dark/12 pt-6">
            {/*
              Иконки — голыми линиями, без кружка. В кружке они читались
              как кнопки, хотя нажимать тут нечего: карточка — текст, а
              не ссылка. Тот же штрих 1.6 и сетка 24×24, что у иконок в
              шапке: один набор на весь сайт.
            */}
            <svg
              aria-hidden
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-7 w-7 text-accent"
            >
              {reason.icon.map((d) => (
                <path key={d} d={d} />
              ))}
            </svg>
            <h3 className="max-w-[22ch] font-[family-name:var(--font-display)] text-[clamp(19px,1.7vw,24px)] leading-[1.15] tracking-[-0.01em]">
              {reason.title}
            </h3>
            <p className="max-w-[46ch] text-[15px] leading-[1.55] text-[#444442]">{reason.text}</p>
          </div>
        ))}
      </div>
    </Section>
  )
}
