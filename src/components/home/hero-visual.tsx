'use client'

import { useState } from 'react'
import { HERO_SLIDES, HeroBackground } from './hero-background'
import styles from './hero-visual.module.css'

const captions = HERO_SLIDES.map((slide) => slide.caption)

export function HeroVisual() {
  const [scene, setScene] = useState(0)

  return (
    <>
      <HeroBackground onSlideChange={setScene} />
      <div className={styles.shade} aria-hidden="true" />
      <div className={styles.copy}>
        <h1 className={styles.title}>
          {/*
            Строка-ключ стоит первой строкой самого H1, а не отдельной
            подписью над ним. Так «фаркопы с установкой в Петербурге»
            попадает и в заголовок первого уровня (это важно поиску), и
            в глаз человеку — но не спорит со слоганом: она мельче и
            тише, а красная черта подчёркивает уже «возможностей».
          */}
          <span className={styles.kicker}>Фаркопы с установкой в Санкт-Петербурге</span>
          <span className={styles.line}><span>Больше</span></span>
          <span className={styles.line}><span className={styles.emphasis}>возможностей</span></span>
          <span className={`${styles.line} ${styles.lastLine}`}><span>для вашего авто</span></span>
        </h1>
        <div className={styles.captionArea} aria-hidden="true">
          {captions.map((caption, index) => (
            <div key={caption} className={styles.caption} data-active={scene === index}>
              <span className={styles.number}>0{index + 1}</span>
              <span>{caption}</span>
              <span className={styles.arrow}>↗</span>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
