'use client'

/**
 * Знак вопроса с пояснением.
 *
 * Нужен там, где стоит термин, который покупатель встречает впервые:
 * тяговая и вертикальная нагрузка — самые частые. Человек видит «1500 кг»
 * и не знает, это масса прицепа или что-то ещё.
 *
 * Появляется и по наведению, и по фокусу. Фокус здесь не про клавиатуру
 * (хотя и про неё тоже): на телефоне наведения не существует, а касание
 * даёт фокус — без этого подсказка была бы недоступна половине
 * посетителей.
 *
 * Не `title` у элемента: браузер показывает его через секунду с лишним,
 * своим шрифтом и не даёт стилизовать, а на телефоне не показывает
 * вовсе.
 */
export function Hint({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button
        type="button"
        aria-label={text}
        className="flex h-[15px] w-[15px] cursor-help items-center justify-center rounded-full border border-current text-[10px] leading-none text-[#444442] transition-colors hover:text-ink-dark focus:text-ink-dark focus:outline-none"
      >
        ?
      </button>

      {/*
        Всплывает над полем, а не под ним: под полем в сетке фильтра
        сразу идёт следующая строка, и подсказка накрывала бы её.
      */}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-[240px] -translate-x-1/2 rounded-lg bg-ink-dark px-3 py-2 text-[12px] font-normal leading-[1.45] text-paper opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
