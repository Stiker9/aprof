export interface FaqItem {
  question: string
  answer: string
}

/**
 * Аккордеон вопросов на `<details>`/`<summary>`.
 *
 * Без единой строки JavaScript: страница остаётся полностью статической,
 * а ответы лежат в разметке и попадают в индекс независимо от того,
 * раскрыт блок или нет.
 *
 * Цвета заданы прозрачностью от текущего цвета текста — аккордеон стоит
 * и на тёмной главной, и на светлых страницах каталога.
 */
export function Accordion({ items, openFirst = true }: { items: FaqItem[]; openFirst?: boolean }) {
  return (
    <div className="border-t border-current/12">
      {items.map((item, index) => (
        <details key={item.question} open={openFirst && index === 0} className="group border-b border-current/12">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 text-[clamp(16px,2vw,19px)] marker:hidden [&::-webkit-details-marker]:hidden">
            {item.question}
            {/*
              Плюс поворачивается в крестик при раскрытии — состояние
              видно, пока человек ещё не начал читать ответ.
            */}
            <span
              aria-hidden
              className="shrink-0 text-2xl font-light opacity-45 transition-transform duration-200 group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="max-w-[70ch] pb-7 text-[16px] leading-relaxed opacity-70">{item.answer}</p>
        </details>
      ))}
    </div>
  )
}
