import { HeroVisual } from './hero-visual'
import { PickerBar } from '@/components/picker-bar'

/**
 * Первый экран.
 *
 * Строка подбора лежит на фотографии сразу под шапкой — как было.
 * Отступ берётся из переменной высоты шапки, чтобы на телефоне, где она
 * ниже, между ними не появлялась щель.
 */
export function Hero() {
  return (
    <section className="hero-preview relative h-[var(--screen-h)] min-h-[620px] overflow-hidden bg-bg text-ink">
      <HeroVisual />
      <div className="absolute inset-x-0 top-[var(--header-h)] z-[5]">
        <PickerBar transparent />
      </div>
    </section>
  )
}
