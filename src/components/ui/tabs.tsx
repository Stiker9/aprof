import type { ReactNode } from 'react'

export interface Tab {
  label: string
  content: ReactNode
}

/**
 * Вкладки без JavaScript.
 *
 * Состояние держат радиокнопки, показ панелей и подсветку активной
 * вкладки делает CSS в globals.css. Страница остаётся статической,
 * а содержимое обеих вкладок лежит в разметке и индексируется — в
 * отличие от вкладок на скриптах, где поиск видит только первую.
 *
 * Порядок детей менять нельзя: сначала все радиокнопки, потом все
 * метки, потом все панели. CSS находит пару «вкладка ↔ панель» по
 * порядковому номеру, и посторонний `div` среди детей всё сломает.
 * Поэтому разметку задаёт компонент, а не вызывающий код.
 */
const TAB =
  'cursor-pointer rounded-full border border-current/20 px-5 py-2.5 text-sm opacity-70 transition-colors hover:opacity-100'

export function Tabs({
  name,
  tabs,
  tone = 'dark',
  className = '',
}: {
  /** Имя группы радиокнопок — своё на каждый набор вкладок на странице. */
  name: string
  tabs: Tab[]
  tone?: 'dark' | 'light'
  className?: string
}) {
  return (
    <div
      className={`tabs ${tone === 'light' ? 'tabs-light' : ''} flex flex-wrap items-start gap-3 ${className}`}
    >
      {tabs.map((tab, index) => (
        <input
          key={`radio-${tab.label}`}
          type="radio"
          name={name}
          id={`${name}-${index}`}
          defaultChecked={index === 0}
          className="sr-only"
        />
      ))}

      {tabs.map((tab, index) => (
        <label key={`label-${tab.label}`} htmlFor={`${name}-${index}`} className={TAB}>
          {tab.label}
        </label>
      ))}

      {tabs.map((tab) => (
        <div key={`panel-${tab.label}`} className="tab-panel mt-4 w-full">
          {tab.content}
        </div>
      ))}
    </div>
  )
}
