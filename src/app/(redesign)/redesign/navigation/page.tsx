'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import styles from './variants.module.css'

const items = [
  ['Подбор', 'M17 10A7 7 0 1 1 3 10A7 7 0 1 1 17 10M15 15L21 21'],
  ['Каталог', 'M3 3H10V10H3ZM14 3H21V10H14ZM3 14H10V21H3ZM14 14H21V21H14Z'],
  ['Установка', 'M14 6L18 10L21 7A6 6 0 0 1 13 14L6 21A2 2 0 0 1 3 18L10 11A6 6 0 0 1 17 3Z'],
  ['Услуги', 'M7 3V8M17 3V8M5 8H19V11A7 7 0 0 1 5 11ZM12 18V22'],
  ['Акции', 'M19 5L5 19M9 6A3 3 0 1 1 3 6A3 3 0 1 1 9 6ZM21 18A3 3 0 1 1 15 18A3 3 0 1 1 21 18Z'],
  ['Контакты', 'M20 10C20 16 12 22 12 22S4 16 4 10A8 8 0 1 1 20 10ZM15 10A3 3 0 1 1 9 10A3 3 0 1 1 15 10Z'],
]

const variants = [
  { title: 'Крупнее и увереннее', description: 'Текст 18 px, больше расстояния между пунктами. Красная линия и лёгкая заливка при наведении.', className: styles.type },
  { title: 'Контрастная панель', description: 'Меню на отдельной графитовой полосе. Крупные подписи, красные иконки и полная красная заливка активного пункта.', className: styles.bar },
  { title: 'Иконки как ориентиры', description: 'Крупные иконки над названиями. Более выразительная и высокая шапка, каждый раздел легко различить.', className: styles.icons },
]

function Preview({ index }: { index: number }) {
  const [selected, setSelected] = useState<string | null>(null)
  const variant = variants[index]
  return (
    <section className={styles.option}>
      <div className={styles.caption}>
        <span className={styles.number}>0{index + 1}</span>
        <div><h2>{variant.title}</h2><p>{variant.description}</p></div>
        {index === 1 && <span className={styles.recommend}>Мой выбор</span>}
      </div>
      <div className={`${styles.preview} ${variant.className}`}>
        <div className={styles.header}>
          <Image src="/images/redesign/vashfarkop-vf-transparent.png" alt="VASHFARKOP" width={2170} height={725} sizes="190px" className={styles.logo} />
          <nav aria-label={`Вариант ${index + 1}`} className={styles.nav}>
            {items.map(([label, path]) => (
              <button type="button" key={label} aria-pressed={selected === label}
                onClick={() => setSelected(selected === label ? null : label)}>
                {index !== 0 && <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>}
                <span>{label}</span>
              </button>
            ))}
          </nav>
          <div className={styles.phone}>+7 (812) 214-27-03<small>Ежедневно до 20:00</small></div>
        </div>
        <div className={styles.context}><span>ПОДБОР · ПРОДАЖА · УСТАНОВКА</span><p>Фаркопы с установкой<br />в Санкт-Петербурге</p></div>
      </div>
      <p className={styles.status} aria-live="polite">{selected ? `Выделен раздел «${selected}». Повторный клик снимает выделение.` : 'Наведите курсор или нажмите на пункт, чтобы увидеть выделение.'}</p>
    </section>
  )
}

export default function NavigationVariants() {
  return (
    <main className={styles.page}>
      <Link href="/redesign" className={styles.back}>← Копия главной</Link>
      <h1>Делаем навигацию заметнее</h1>
      <p className={styles.intro}>Три варианта в контексте шапки. Одинаковые разделы — разный визуальный акцент. Кнопки здесь показывают оформление и не уводят со страницы.</p>
      {variants.map((variant, index) => <Preview key={variant.title} index={index} />)}
    </main>
  )
}
