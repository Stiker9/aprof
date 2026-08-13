import Image from 'next/image'
import { ArrowLink } from '@/components/ui/arrow-link'

/**
 * Установка и доставка.
 *
 * Экран разделён вертикально пополам с резкой границей: слева город,
 * справа вся остальная страна. Половины равны по площади намеренно —
 * доставка для заказчика такой же канал, как сервис, и уменьшенная
 * колонка читалась бы как приписка.
 *
 * Секция не использует общую обёртку Section: у неё два фона вместо
 * одного, и внутренние отступы задаются каждой половине отдельно.
 */
export function InstallDelivery() {
  return (
    <section className="grid lg:grid-cols-2">
      {/* Петербург — тёмная половина с фотографией под текстом */}
      <div className="relative overflow-hidden bg-bg px-6 py-20 md:py-28 lg:px-14">
        <Image
          src="/images/install-hero.webp"
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover opacity-25"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/30" />

        <div className="relative mx-auto flex h-full max-w-[620px] flex-col lg:mx-0 lg:ml-auto lg:pr-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-ink-dim">Вы в Петербурге</p>

          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,3vw,34px)] leading-tight tracking-[-0.03em] text-ink">
            Один визит
          </h2>

          <p className="mt-4 max-w-[42ch] text-[17px] text-ink-muted">
            Привозите машину утром — забираете с фаркопом и документами в тот же день.
          </p>

          <div className="mt-12">
            <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.02em] text-ink">
              3 часа
            </div>
            <div className="mt-2 text-sm text-ink-muted">средняя установка</div>
          </div>

          <div className="mt-10">
            <ArrowLink href="/ustanovka-farkopa">Цены на установку</ArrowLink>
          </div>
        </div>
      </div>

      {/* Доставка — светлая половина, без фотографии: контраст и есть граница */}
      <div className="bg-paper px-6 py-20 text-ink-dark md:py-28 lg:px-14">
        <div className="mx-auto flex h-full max-w-[620px] flex-col lg:mx-0 lg:mr-auto lg:pl-8">
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-55">Вы в другом городе</p>

          <h2 className="mt-4 font-[family-name:var(--font-display)] text-[clamp(26px,3vw,34px)] leading-tight tracking-[-0.03em]">
            Отправим куда угодно
          </h2>

          <p className="mt-4 max-w-[42ch] text-[17px] opacity-70">
            Собираем заказ с инструкцией и сертификатом и передаём в СДЭК. Установите у себя.
          </p>

          <div className="mt-12">
            <div className="font-[family-name:var(--font-display)] text-[clamp(34px,5vw,48px)] leading-none tracking-[-0.02em]">
              1 100
            </div>
            <div className="mt-2 text-sm opacity-60">городов доставки СДЭК</div>
          </div>

          <div className="mt-10">
            <ArrowLink href="/dostavka">Условия доставки</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  )
}
