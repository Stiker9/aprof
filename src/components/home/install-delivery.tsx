import Image from 'next/image'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionTitle } from '@/components/ui/section'

/**
 * Как вы получите фаркоп.
 *
 * В макете это переключатель на два состояния, а не две колонки рядом:
 * человек либо приезжает в сервис, либо заказывает доставку — сразу оба
 * сценария ему не нужны, и показывать их одновременно значит заставить
 * читать половину лишнего.
 *
 * Переключение сделано на радиокнопках, без JavaScript: страница остаётся
 * полностью статической, а состояние живёт в самой разметке. Сами
 * радиокнопки лежат вне потока и в раскладку не вмешиваются.
 *
 * Показ панелей и подсветка активной вкладки описаны обычным CSS в
 * globals.css по классу `tabs` — почему не классами Tailwind, написано
 * там же.
 */
const TAB =
  'cursor-pointer rounded-full border border-line px-5 py-2.5 text-sm text-ink-muted transition-colors hover:text-ink'
const PANEL = 'tab-panel mt-4 w-full'

export function InstallDelivery() {
  return (
    <Section tone="dark" className="relative overflow-hidden">
      <Image
        src="/images/install-hero.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-15"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-bg via-bg/85 to-bg" />

      <div className="relative">
        <Eyebrow>Как вы получите фаркоп</Eyebrow>

        <div className="tabs mt-8 flex flex-wrap items-start gap-3">
          <input
            type="radio"
            name="poluchenie"
            id="poluchenie-spb"
            defaultChecked
            className="sr-only"
          />
          <input type="radio" name="poluchenie" id="poluchenie-dostavka" className="sr-only" />

          <label htmlFor="poluchenie-spb" className={TAB}>
            Я в Петербурге
          </label>
          <label htmlFor="poluchenie-dostavka" className={TAB}>
            Другой город
          </label>

          {/* Петербург */}
          <div data-tab="spb" className={PANEL}>
            <SectionTitle>
              Один визит
              <span className="block opacity-45">— и вы за рулём</span>
            </SectionTitle>

            <p className="mt-5 max-w-[52ch] text-[17px] text-ink-muted">
              Приезжайте утром на Софийскую — уедете с фаркопом, электрикой и документами для ТО.
            </p>

            <div className="mt-12 flex flex-wrap gap-x-16 gap-y-8">
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.02em]">
                  3 часа
                </div>
                <div className="mt-2 text-sm text-ink-muted">средняя установка</div>
              </div>
              <div>
                <div className="text-[19px]">Софийская, 72</div>
                <div className="mt-2 text-sm text-ink-muted">Пн–Сб 9:00–19:00</div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <ArrowLink href="/zapis">Записаться на установку</ArrowLink>
              <ArrowLink href="/ustanovka-farkopa">Цены на установку</ArrowLink>
            </div>
          </div>

          {/* Доставка */}
          <div data-tab="dostavka" className={PANEL}>
            <SectionTitle>
              Отправим
              <span className="block opacity-45">куда угодно</span>
            </SectionTitle>

            <p className="mt-5 max-w-[52ch] text-[17px] text-ink-muted">
              Все позиции каталога доступны к доставке в любой город России — до двери или пункта
              выдачи.
            </p>

            <div className="mt-12 flex flex-wrap gap-x-16 gap-y-8">
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.02em]">
                  1 100
                </div>
                <div className="mt-2 text-sm text-ink-muted">городов · доставка СДЭК</div>
              </div>
              <div>
                <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.02em]">
                  1–7 дней
                </div>
                <div className="mt-2 text-sm text-ink-muted">срок в пути</div>
              </div>
            </div>

            <div className="mt-12 flex flex-wrap items-baseline gap-x-10 gap-y-4">
              <ArrowLink href="/dostavka">Рассчитать доставку</ArrowLink>
              <ArrowLink href="/oplata">Условия и оплата</ArrowLink>
            </div>
          </div>
        </div>
      </div>
    </Section>
  )
}
