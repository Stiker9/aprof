import { RequestForm } from '@/redesign/components/request-form'
import { Eyebrow, Section, SectionLead, SectionTitle } from '@/redesign/components/ui/section'
import { CONTACTS } from '@/content/contacts'

/** Контакты с формой заявки — последняя секция главной перед подвалом. */
export function Contacts() {
  return (
    <Section tone="light">
      <Eyebrow>Контакты</Eyebrow>
      {/*
        Заголовок называет форму, а не приезд и звонок. Прежнее
        «Приезжайте или позвоните» перечисляло два способа из трёх, а
        третий — заявка — занимает половину блока и оставался
        неназванным. Адрес и телефон никуда не делись, они рядом.
      */}
      <SectionTitle>Оставьте номер — перезвоним</SectionTitle>
      <SectionLead>
        {/*
          Было ещё две версии длиннее: сперва три рубленых предложения
          («Можно приехать без записи. По записи — сразу на пост, без
          ожидания. Перезваниваем за 15 минут.»), затем два («Перезвоним
          за 15 минут в рабочие часы. По записи — сразу на пост без
          очереди; можно и без неё.»). Заказчик обе назвал избыточными и
          попросил убрать вторую часть про запись целиком — осталось
          одно обещание, самое важное.
        */}
        Перезвоним за 15 минут в рабочие часы.
      </SectionLead>

      {/*
        Не 50/50, а 480px формы и 380px контактов с зазором 80 — как
        в исходнике. Поровну разделённые колонки на широком экране
        растягивали бы поля ввода до неприличной ширины.
      */}
      <div className="mt-14 flex flex-col gap-14 lg:flex-row lg:gap-20">
        <div className="w-full lg:max-w-[480px]">
          <RequestForm />
        </div>

        <div className="grid w-full content-start gap-7 lg:w-[380px] lg:shrink-0">
          <div>
            <div className="text-sm opacity-55">Адрес</div>
            <div className="mt-2 text-[19px]">{CONTACTS.address}</div>
            {CONTACTS.addressNote ? (
              <div className="mt-1 text-sm opacity-55">{CONTACTS.addressNote}</div>
            ) : null}
          </div>

          <div>
            <div className="text-sm opacity-55">Телефон</div>
            <a
              href={CONTACTS.phoneHref}
              className="mt-2 block font-[family-name:var(--font-display)] text-[24px] leading-none transition-colors hover:text-accent"
            >
              {CONTACTS.phone}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Почта</div>
            <a href={CONTACTS.emailHref} className="mt-2 block text-[19px] hover:text-accent">
              {CONTACTS.email}
            </a>
          </div>

          <div>
            <div className="text-sm opacity-55">Часы работы</div>
            <div className="mt-2 text-[19px]">{CONTACTS.hours}</div>
          </div>

          <a
            href={CONTACTS.routeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-[15px] text-accent hover:underline"
          >
            Построить маршрут <span aria-hidden>→</span>
          </a>
        </div>
      </div>

      {/*
        Карта грузится лениво: виджет тянет чужие скрипты, и делать это
        при открытии главной незачем — до контактов ещё надо долистать.
        Заголовок у iframe обязателен, иначе для читалки это безымянная
        рамка, в которую непонятно зачем заходить.
      */}
      <div className="mt-12 overflow-hidden rounded-[var(--radius-card)] border border-line-light">
        <iframe
          src={CONTACTS.mapEmbedUrl}
          title={`Сервис VASHFARKOP на карте: ${CONTACTS.address}`}
          loading="lazy"
          allowFullScreen
          className="h-[380px] w-full border-0"
        />
      </div>
    </Section>
  )
}
