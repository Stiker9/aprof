import Image from 'next/image'
import { ArrowLink } from '@/components/ui/arrow-link'
import { Eyebrow, Section, SectionTitle } from '@/components/ui/section'
import { Tabs } from '@/components/ui/tabs'

/**
 * Как вы получите фаркоп.
 *
 * В макете это переключатель на два состояния, а не две колонки рядом:
 * человек либо приезжает в сервис, либо заказывает доставку — сразу оба
 * сценария ему не нужны, и показывать их одновременно значит заставить
 * читать половину лишнего.
 */
function Spb() {
  return (
    <>
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
    </>
  )
}

function Delivery() {
  return (
    <>
      <SectionTitle>
        Отправим
        <span className="block opacity-45">куда угодно</span>
      </SectionTitle>

      <p className="mt-5 max-w-[52ch] text-[17px] text-ink-muted">
        Все позиции каталога доступны к доставке в любой город России — до двери или пункта выдачи.
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
        <ArrowLink href="/dostavka">Условия доставки</ArrowLink>
      </div>
    </>
  )
}

export function InstallDelivery() {
  return (
    <Section tone="dark" className="relative overflow-hidden">
      {/*
        Широкий кадр 2104×747 ложится ровно в пропорции секции. Градиент
        идёт слева направо, а не сверху вниз: текст стоит слева, и
        затемнять надо ту половину, где он лежит.
      */}
      <Image
        src="/images/prado-embankment.webp"
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-right"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, rgb(10,10,11) 0%, rgba(10,10,11,0.7) 18%, rgba(10,10,11,0.35) 45%, rgba(10,10,11,0.15) 100%)',
        }}
      />

      <div className="relative">
        <Eyebrow>Как вы получите фаркоп</Eyebrow>

        <Tabs
          name="poluchenie"
          className="mt-8"
          tabs={[
            { label: 'Я в Петербурге', content: <Spb /> },
            { label: 'Другой город', content: <Delivery /> },
          ]}
        />
      </div>
    </Section>
  )
}
