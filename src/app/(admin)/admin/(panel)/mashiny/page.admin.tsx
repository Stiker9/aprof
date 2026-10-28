import Link from 'next/link'
import { requireAdmin } from '@/admin/auth'
import { brandOptions, listOwnCars } from '@/admin/catalog-edit'
import { plural } from '@/catalog/format'
import { CarForm, DeleteCarButton } from '@/components/admin/car-form'
import { Empty, PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Машины, которых нет в каталоге поставщика.
 *
 * Каталог загружен один раз, в августе 2026, и сам не пополняется. А
 * новые машины — особенно китайские — выходят постоянно, и фаркопы на
 * них ставят раньше, чем они попадают в чьи-то справочники. Здесь
 * владелец добавляет машину сам; дальше в «Товарах» привязывает к ней
 * фаркоп — существующий («Подходит к») или новый («Новый фаркоп»).
 *
 * Машина без фаркопов на сайт не выходит: пустая страница «фаркопов на
 * эту машину нет» хуже, чем никакой.
 */
export default async function CarsPage() {
  await requireAdmin()

  const db = await getDb()
  const [brands, own] = await Promise.all([brandOptions(db), listOwnCars(db)])

  return (
    <>
      <PageHead title="Машины" lead="Новые машины, которых нет в каталоге поставщика" />

      <PageBody>
        <section className="mb-8 rounded-card border border-line-light bg-white p-5">
          <h2 className="mb-1 text-[15px] font-semibold">Добавить машину</h2>
          <p className="mb-4 max-w-2xl text-[13px] text-ink-muted">
            Сначала проверьте подбор в «Товарах» — возможно, машина уже есть под другим названием.
            После добавления привяжите к ней фаркоп: в карточке товара — «Подходит к», или{' '}
            <Link href="/admin/tovary/novyj" className="text-accent hover:underline">
              заведите новый фаркоп
            </Link>
            .
          </p>
          <CarForm brandNames={brands.map((b) => b.label)} />
        </section>

        <h2 className="mb-2 text-[15px] font-semibold">Добавленные вами</h2>
        {own.length === 0 ? (
          <Empty title="Пока ни одной">Машины, которые вы добавите, появятся здесь.</Empty>
        ) : (
          <div className="divide-y divide-line-light overflow-hidden rounded-card border border-line-light bg-white">
            {own.map((car) => (
              <div key={car.variantId} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <span className="font-medium">
                    {car.brand} {car.model}
                  </span>{' '}
                  <span className="text-ink-muted">{car.label}</span>
                </div>
                <div className="flex items-center gap-4 text-[12px]">
                  <span className={car.onSite ? 'text-in-stock' : 'text-ink-muted'}>
                    {car.productCount > 0
                      ? `${car.productCount} ${plural(car.productCount, 'фаркоп', 'фаркопа', 'фаркопов')} · на сайте после публикации`
                      : 'без фаркопов — на сайте не показывается'}
                  </span>
                  {car.productCount === 0 && (
                    <DeleteCarButton variantId={car.variantId} label={`${car.brand} ${car.model} ${car.label}`} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageBody>
    </>
  )
}
