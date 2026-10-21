import Image from 'next/image'
import Link from 'next/link'
import { formatNumber } from '@/catalog/format'
import { urls } from '@/catalog/urls'
import { Eyebrow, Section, SectionTitle } from '@/components/ui/section'

/**
 * Категории: с чего начать.
 *
 * Блок стоит сразу после каталога по маркам и отвечает на вопрос, который
 * возникает после «а есть ли под мою машину»: что ещё нужно, кроме самого
 * фаркопа. Идея подсмотрена у конкурентов (msk.farkop.ru, vseemfarkop.ru):
 * крупная карточка каталога плюс карточки услуг и цифры.
 *
 * Что здесь работает на поиск:
 *  - h2 секции и по h3 в каждой карточке;
 *  - четыре ссылки с осмысленными анкорами (каталог, установка,
 *    электрика, подбор) и абзац текста под каждой;
 *  - строка популярных моделей — шестнадцать глубоких внутренних
 *    ссылок на страницы моделей, а не на разделы;
 *  - цифры (позиции, марки, гарантия, часы) вместо выдуманных рейтингов.
 *
 * Чего здесь намеренно нет: «вставок под квадрат» и «велокреплений», как
 * у конкурента. Таких товаров мы не продаём, а ссылка в никуда на главной
 * хуже, чем её отсутствие.
 */
export interface PopularModel {
  brandName: string
  brandSlug: string
  name: string
  slug: string
}

const ICONS = {
  wrench: 'M14 6L18 10L21 7A6 6 0 0 1 13 14L6 21A2.1 2.1 0 0 1 3 18L10 11A6 6 0 0 1 17 3Z',
  plug: 'M7 3V8M17 3V8M5 8H19V11A7 7 0 0 1 5 11ZM12 18V22',
  search: 'M21 21L16.6 16.6M18 10A8 8 0 1 1 2 10A8 8 0 1 1 18 10',
  truck:
    'M3 6H14V17H3ZM14 10H18L21 14V17H14M8 18A2 2 0 1 1 4 18A2 2 0 1 1 8 18M20 18A2 2 0 1 1 16 18A2 2 0 1 1 20 18',
}

function Icon({ path, className }: { path: string; className: string }) {
  return (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border ${className}`}>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
      >
        <path d={path} />
      </svg>
    </span>
  )
}

function Arrow() {
  return (
    <span
      aria-hidden
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-current/30 text-[15px] transition-transform group-hover:translate-x-0.5"
    >
      →
    </span>
  )
}

/** Карточка услуги: иконка сверху, заголовок и текст внизу. */
function ServiceCard({
  href,
  icon,
  title,
  text,
  tone,
}: {
  href: string
  icon: string
  title: string
  text: string
  tone: 'accent' | 'dark'
}) {
  const skin =
    tone === 'accent'
      ? 'bg-accent text-[#FFF6F4] hover:brightness-110'
      : 'border border-line bg-surface-2 text-ink hover:border-white/25'
  const note = tone === 'accent' ? 'text-[#FFF6F4]' : 'text-ink-muted'
  const iconSkin = tone === 'accent' ? 'border-white/40' : 'border-white/20'

  return (
    <Link
      href={href}
      className={`group flex h-full min-h-[200px] flex-col justify-between gap-6 rounded-[18px] p-7 transition-[filter,border-color] ${skin}`}
    >
      <div className="flex items-start justify-between">
        <Icon path={icon} className={iconSkin} />
        <Arrow />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="font-[family-name:var(--font-display)] text-[22px] leading-[1.1] tracking-[-0.02em]">
          {title}
        </h3>
        <p className={`text-[14px] leading-[1.5] ${note}`}>{text}</p>
      </div>
    </Link>
  )
}

export function Categories({
  productCount,
  brandCount,
  models,
}: {
  productCount: number
  brandCount: number
  models: PopularModel[]
}) {
  return (
    <Section tone="dark">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5">
        <div>
          <Eyebrow>Каталог и услуги</Eyebrow>
          {/*
            В заголовке — слова, по которым ищут: «фаркопы», «установка».
            Прежнее «Что нужно вашему авто» звучало хорошо, но поисковику
            ничего не говорило, а это второй по весу заголовок главной.
          */}
          <SectionTitle>Фаркопы и установка под ваш автомобиль</SectionTitle>
        </div>
        {/*
          Подводка несёт ключевые слова естественно, а не списком:
          «фаркоп», «кузов», «электрика», «документы для ТО», «установка».
          Для главной это важнее, чем кажется: до этого блока на странице
          было всего две фразы текста.
        */}
        <p className="max-w-[46ch] text-[15px] leading-[1.6] text-ink-muted">
          Фаркоп — это не только шар сзади. Нужно крепление под конкретный кузов, электрика для
          прицепа и документы для ТО. Соберём комплект под вашу машину и поставим за один визит.
        </p>
      </div>

      {/*
        Слева крупная карточка каталога, справа сетка 2×2 из услуг.
        Такой расклад повторяет то, что понравилось в примерах: одна
        большая дверь и четыре маленькие. Карточка занимает два ряда,
        поэтому её снимок прижат к низу.
      */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href={urls.catalog()}
          className="group grid grid-rows-2 overflow-hidden rounded-[18px] border border-line bg-[#0A0A0B] text-ink transition-[border-color] hover:border-white/25 sm:col-span-2 lg:row-span-2"
        >
          {/*
            Фон карточки — тот же почти чёрный, что у снимка. Раньше она
            была белой и на тёмной секции читалась заплаткой, а белый верх
            с тёмным снимком внизу разваливал её на две половины. Теперь
            текст и снимок — одно полотно.
          */}
          {/*
            Ровно половина карточки — текст, половина — снимок. Сетка
            `grid-rows-2` держит их равными, как бы карточка ни вытянулась
            по высоте соседних плиток.
          */}
          <div className="flex flex-col gap-3 p-7 lg:p-8">
            <h3 className="font-[family-name:var(--font-display)] text-[clamp(20px,1.9vw,28px)] leading-[1.05] tracking-[-0.02em]">
              Фаркопы для легковых автомобилей
            </h3>
            <p className="max-w-[42ch] text-[14px] leading-[1.5] text-ink-muted">
              {formatNumber(productCount)} позиций для {formatNumber(brandCount)} марок. Подбор по модели,
              кузову и году выпуска.
            </p>
            <span className="mt-auto inline-flex w-fit items-center gap-2.5 rounded-full bg-white px-5 py-3 text-[14px] font-semibold text-ink-dark transition-colors group-hover:bg-accent group-hover:text-[#FFF6F4]">
              Открыть каталог фаркопов <span aria-hidden>→</span>
            </span>
          </div>

          {/*
            object-contain, а не cover: снимок широкий, и при обрезке шар
            уезжал за нижний край — на витрине оставался кусок бампера.
            Фон подложки тот же, что у снимка, поэтому поля по краям не
            видны как рамка.
          */}
          <div className="relative bg-[#0A0A0B]">
            <Image
              src="/images/towbar-hero.webp"
              alt="Съёмный фаркоп с шаром, установленный на автомобиль"
              fill
              sizes="(min-width: 1024px) 55vw, 100vw"
              className="object-cover object-[50%_68%]"
            />
          </div>
        </Link>

        <ServiceCard
          href="/ustanovka-farkopa"
          icon={ICONS.wrench}
          title="Установка фаркопа"
          text="Монтаж по штатным точкам, антикор и документы для ТО. Один визит — около трёх часов."
          tone="accent"
        />
        <ServiceCard
          href="/uslugi#elektrika"
          icon={ICONS.plug}
          title="Электрика и розетка"
          text="Розетка, проводка и блок согласования — фары и поворотники прицепа работают как штатные."
          tone="dark"
        />
        <ServiceCard
          href="/podbor"
          icon={ICONS.search}
          title="Подбор по авто"
          text="Четыре шага: марка, модель, кузов и годы. Покажем только те фаркопы, что встанут без переделок."
          tone="dark"
        />
        <ServiceCard
          href="/dostavka"
          icon={ICONS.truck}
          title="Доставка по России"
          text="СДЭК до двери или пункта выдачи, 1 100 городов. Срок в пути — от одного до семи дней."
          tone="dark"
        />
      </div>

      {/*
        Цифры из этого блока переехали в полосу под первым экраном:
        «2 года» и «3 часа» стояли тут и там, а «5 808 позиций» уже
        написано в большой карточке каталога. Осталась только строка
        моделей — она здесь по делу.
      */}

      {/*
        Ссылки на конкретные модели. Человеку это ярлык «а вдруг моя»,
        роботу — путь вглубь каталога: без них с главной можно попасть
        только на страницы марок, а модели и кузова остаются в двух кликах
        от входа. Какие модели — решает список на главной странице.
      */}
      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2 border-t border-line pt-6 text-[14px]">
        <span className="text-ink-muted">Популярные модели:</span>
        {models.map((model) => (
          <Link
            key={`${model.brandSlug}-${model.slug}`}
            href={urls.model(model.brandSlug, model.slug)}
            className="text-ink/85 transition-colors hover:text-accent"
          >
            {model.brandName} {model.name}
          </Link>
        ))}
      </div>
    </Section>
  )
}
