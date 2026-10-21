'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { formatCount } from '@/catalog/format'
import { logoFor } from '@/catalog/logos'
import type { BrandRow } from '@/catalog/queries'
import { urls } from '@/catalog/urls'
import styles from './brands.module.css'

const FILTERS = [
  { label: 'Все марки', slugs: null },
  { label: 'Китайские', slugs: new Set('baic byd changan chery cheryexeed dongfeng exeed faw foton geely great-wall haval hongqi jac jaecoo jetour jetta kaiyi knewstar li-auto lifan lixiang lynk-co omoda oting polar-stone rox soueast tank voyah wey zotye forthing gac jmc swm'.split(' ')) },
  { label: 'Европейские', slugs: new Set('alfa-romeo audi bmw citroen cupra dacia ds fiat iveco jaguar lancia land-rover ldv maserati mercedes mg mini opel peugeot porsche renault rover saab seat skoda volkswagen volvo'.split(' ')) },
  { label: 'Японские и корейские', slugs: new Set('acura daewoo daihatsu datsun genesis honda hyundai infiniti isuzu kgm kia lexus mazda mitsubishi nissan ssang-yong subaru suzuki toyota'.split(' ')) },
  { label: 'Российские', slugs: new Set('ambertruck gaz izh lada moskvich solaris sollers tagaz uaz vortex xcite'.split(' ')) },
]
const WIDE_LOGOS = new Set(['haval', 'kia', 'ford', 'hyundai', 'lexus', 'subaru', 'chevrolet', 'exeed', 'cheryexeed', 'geely'])

export function Brands({ brands, totalBrands }: { brands: BrandRow[]; totalBrands: number }) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState(0)
  const term = query.trim().toLocaleLowerCase('ru')
  const searching = term.length > 0 || filter !== 0
  const filtered = brands.filter(brand =>
    (!FILTERS[filter].slugs || FILTERS[filter].slugs?.has(brand.slug)) &&
    (!term || `${brand.name} ${brand.slug}`.toLocaleLowerCase('ru').includes(term)))
  const visible = searching ? filtered : [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 12)

  return (
    <section className={styles.section} aria-labelledby="brands-title">
      <div className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Каталог</p>
          <h2 id="brands-title" className={styles.title}>Выберите марку</h2>
        </div>
        <label className={styles.search}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg>
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Найти марку автомобиля" aria-label="Найти марку автомобиля" />
        </label>
      </div>
      <div className={styles.filters} role="group" aria-label="Регион марки">
        {FILTERS.map((item, index) => (
          <button key={item.label} type="button" aria-pressed={filter === index} className={styles.filter} onClick={() => setFilter(index)}>
            {filter === index && <span className={styles.dot} aria-hidden="true" />}{item.label}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {visible.map(brand => {
          const logo = logoFor(brand.slug)
          return (
            <Link key={brand.slug} href={urls.brand(brand.slug)} className={styles.card}>
              <span className={`${styles.logo} ${WIDE_LOGOS.has(brand.slug) ? styles.wideLogo : ''}`}>
                {logo ? <Image src={logo} alt="" fill sizes="72px" className="object-contain" /> : <span aria-hidden="true" className={styles.monogram}>{brand.name.slice(0, 2)}</span>}
              </span>
              <span className={styles.details}>
                <span className={styles.name}>{brand.name}</span>
                <span className={styles.count}>{formatCount(brand.modelCount, 'модель', 'модели', 'моделей')}</span>
              </span>
              <span aria-hidden="true" className={styles.arrow}>↗</span>
            </Link>
          )
        })}
      </div>
      {visible.length === 0 && <div className={styles.empty}>Марки не найдены. Попробуйте другое название или выберите «Все марки».</div>}
      <div className={styles.footer}>
        <Link href={urls.catalog()} className={styles.all}>Все {formatCount(totalBrands, 'марка', 'марки', 'марок')}<span aria-hidden="true">↗</span></Link>
        <span className={styles.result} role="status">{searching ? `Найдено: ${visible.length}` : '12 популярных марок'}</span>
      </div>
    </section>
  )
}
