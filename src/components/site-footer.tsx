import Link from 'next/link'
import { urls } from '@/catalog/urls'
import { CONTACTS, LEGAL_ENTITY } from '@/content/contacts'

const POPULAR = [
  { name: 'Toyota', slug: 'toyota' },
  { name: 'Kia', slug: 'kia' },
  { name: 'Hyundai', slug: 'hyundai' },
  { name: 'Volkswagen', slug: 'volkswagen' },
  { name: 'Renault', slug: 'renault' },
  { name: 'Nissan', slug: 'nissan' },
]

/**
 * Три услуги ведут на якоря одной страницы, а не на свои страницы:
 * по абзацу текста на страницу дало бы четыре пустышки, а сайт
 * продвигается в поиске, где тонкие страницы тянут вниз весь хост.
 */
const SERVICES = [
  { label: 'Установка фаркопа', href: '/ustanovka-farkopa' },
  { label: 'Электрика и розетка', href: '/uslugi#elektrika' },
  { label: 'Подбор и консультация', href: '/uslugi#podbor' },
  { label: 'Сварка и ремонт ТСУ', href: '/uslugi#remont-tsu' },
]

const COMPANY = [
  { label: 'О нас', href: '/o-nas' },
  { label: 'Наши работы', href: '/nashi-raboty' },
  { label: 'Отзывы', href: '/otzyvy' },
  { label: 'Акции', href: '/akcii' },
  { label: 'Блог', href: '/blog' },
  { label: 'Доставка', href: '/dostavka' },
  { label: 'Гарантия', href: '/garantiya' },
  { label: 'Контакты', href: '/kontakty' },
]

const LEGAL = [
  { label: 'Политика конфиденциальности', href: '/politika-konfidencialnosti' },
  { label: 'Согласие на обработку персональных данных', href: '/soglasie-na-obrabotku' },
  { label: 'Пользовательское соглашение', href: '/polzovatelskoe-soglashenie' },
]

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-bg">
      <div className="mx-auto max-w-[1400px] px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="font-[family-name:var(--font-display)] text-sm tracking-[0.22em] text-ink">
              AUTOPROFI
            </div>
            <p className="mt-3 text-sm text-ink-muted">
              Фаркопы с установкой в Петербурге и доставкой по России
            </p>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Каталог</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {POPULAR.map((b) => (
                <li key={b.slug}>
                  <Link href={urls.brand(b.slug)} className="hover:text-ink">
                    {b.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={urls.catalog()} className="text-accent hover:text-accent-hover">
                  Все 106 марок
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Услуги</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {SERVICES.map((s) => (
                <li key={s.href}>
                  <Link href={s.href} className="hover:text-ink">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 text-[11px] uppercase tracking-[0.2em] text-ink-dim">Компания</div>
            <ul className="space-y-2 text-sm text-ink-muted">
              {COMPANY.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} className="hover:text-ink">
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-6 border-t border-line pt-8">
          <a href={CONTACTS.phoneHref} className="text-2xl font-bold text-ink">
            {CONTACTS.phone}
          </a>
          <span className="text-sm text-ink-muted">{CONTACTS.hours}</span>
          <span className="text-sm text-ink-muted">{CONTACTS.address}</span>
        </div>

        <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-ink-dim">
          <span>
            © 2026 AUTOPROFI · ИНН {LEGAL_ENTITY.inn} · ОГРН {LEGAL_ENTITY.ogrn}
          </span>
          {LEGAL.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-ink-muted">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
