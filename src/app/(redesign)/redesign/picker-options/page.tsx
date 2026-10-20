'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { PickerBrand } from '@/catalog/queries'
import { PickerSelect } from '@/redesign/components/picker-select'
import { urls } from '@/redesign/urls'
import s from './options.module.css'

const variants = [
  ['Светлая панель', 'Белые поля и непрозрачные списки. Максимальная читаемость на фотографии.'],
  ['Графит и красный акцент', 'Сдержанный тёмный подбор с крупными полями, чёткими границами и заметным поиском.'],
  ['Один шаг за раз', 'Сначала марка, затем модель и кузов. Крупный выбор без трёх конкурирующих списков.'],
  ['Панель с популярными марками', 'По вашему референсу: единая линия шагов и быстрый выбор марки по логотипу.'],
]
const popular = ['toyota', 'kia', 'hyundai', 'volkswagen', 'chery', 'geely', 'bmw', 'mazda']

function Example({ index, data }: { index: number; data: PickerBrand[] }) {
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [body, setBody] = useState('')
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState('')
  const [all, setAll] = useState(false)
  const b = data.find(item => item.s === brand)
  const m = b?.m.find(item => item.s === model)
  const v = m?.v.find(item => item.s === body)
  const chooseBrand = (value: string) => { setBrand(value); setModel(''); setBody(''); setStep(1) }
  const chooseModel = (value: string) => { setModel(value); setBody(''); setStep(2) }
  const target = !b ? urls.catalog() : !m ? urls.brand(b.s) : v?.p ? urls.variant(b.s, m.s, v.s) : urls.model(b.s, m.s)
  const options = [data, b?.m ?? [], m?.v ?? []]
  const values = [brand, model, body]
  const labels = ['Марка', 'Модель', 'Кузов и годы']
  const callbacks = [chooseBrand, chooseModel, setBody]
  const visibleBrands = query || all ? data.filter(item => item.n.toLowerCase().includes(query.toLowerCase())) : popular.flatMap(slug => data.filter(item => item.s === slug))
  return (
    <section className={s.example}>
      <div className={s.caption}><span>0{index + 1}</span><div><h2>{variants[index][0]}</h2><p>{variants[index][1]}</p></div></div>
      <div className={`${s.scene} ${index === 0 ? s.light : s.dark} ${index === 3 ? s.premium : ''}`}>
        <div className={s.panel}>
          <div className={s.heading}><h3>Фаркоп под ваш автомобиль</h3><span>Марка → модель → кузов</span></div>
          {index === 2 && <div className={s.steps}>{labels.map((label, i) => (
            <button key={label} type="button" disabled={i === 1 ? !b : i === 2 ? !m : false} aria-pressed={step === i} onClick={() => setStep(i)}>
              <b>{i + 1}</b>{[b?.n, m?.n, v?.n][i] || label}
            </button>
          ))}</div>}
          <div className={`${s.fields} ${index === 2 ? s.single : ''}`}>
            {labels.map((label, i) => (index !== 2 || step === i) && (
              <div key={label} className={s.field}>
                <div className={s.label}>{String(i + 1).padStart(2, '0')} · {label}</div>
                <PickerSelect label={i === 0 ? 'Выберите марку' : i === 1 ? 'Выберите модель' : 'Выберите кузов'}
                  value={values[i]} options={options[i]} disabled={i === 1 ? !b : i === 2 ? !m : false}
                  onChange={callbacks[i]} searchHint={`Найти ${i === 0 ? 'марку' : i === 1 ? 'модель' : 'кузов'}`} />
              </div>
            ))}
            <Link className={s.submit} href={target}>Подобрать <span aria-hidden="true">→</span></Link>
          </div>
          {index === 3 && !brand && <div className={s.brands}>
            <label className={s.search}>Поиск марки<input value={query} onChange={e => setQuery(e.target.value)} placeholder="Например, Toyota" /></label>
            <div className={s.gridTitle}>{query || all ? 'Все марки' : 'Популярные марки'}</div>
            <div className={s.grid}>
              {visibleBrands.map(item => <button type="button" key={item.s} onClick={() => chooseBrand(item.s)}>
                {popular.includes(item.s) ? <Image src={`/images/logos/${item.s}.webp`} width={48} height={48} alt="" /> : <span className={s.initial}>{item.n.slice(0, 2)}</span>}
                <strong>{item.n}</strong><small>{item.c} товаров</small>
              </button>)}
            </div>
            {!visibleBrands.length && <p>Марка не найдена. Попробуйте другое название.</p>}
            <button className={s.showAll} type="button" onClick={() => setAll(!all)}>{all ? 'Показать популярные' : `Все ${data.length} марок`} →</button>
          </div>}
          {index === 3 && b && <button className={s.showAll} type="button" onClick={() => { setBrand(''); setModel(''); setBody('') }}>← Выбрать другую марку</button>}
        </div>
        <div className={s.heroText}>Фаркопы с установкой<br />в Санкт-Петербурге</div>
      </div>
    </section>
  )
}

export default function PickerOptionsPage() {
  const [data, setData] = useState<PickerBrand[]>([])
  const [error, setError] = useState(false)
  useEffect(() => { let active = true; fetch('/podbor.json').then(r => { if (!r.ok) throw new Error(); return r.json() }).then(value => { if (active) setData(value) }).catch(() => { if (active) setError(true) }); return () => { active = false } }, [])
  return <main className={s.page}>
    <Link href="/redesign">← Копия главной</Link>
    <h1>Четыре варианта подбора</h1>
    <p className={s.intro}>Откройте списки, найдите марку и выберите модель. Данные настоящие; кнопка «Подобрать» откроет соответствующий раздел каталога. Главная пока остаётся без изменений.</p>
    {error ? <p role="alert">Не удалось загрузить марки. Обновите страницу.</p> : !data.length ? <p role="status">Загружаем каталог…</p> : variants.map((_, index) => <Example key={index} index={index} data={data} />)}
  </main>
}
