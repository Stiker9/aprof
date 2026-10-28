import Link from 'next/link'
import { requireAdmin } from '@/admin/auth'
import { ballTypes, manufacturerNames } from '@/admin/catalog-edit'
import { NewProductForm } from '@/components/admin/new-product-form'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { getDb } from '@/db/client'

/**
 * Новый фаркоп, которого нет в каталоге поставщика.
 *
 * Если артикул уже есть — форма откажет и подскажет добавить машину к
 * существующему товару: два товара с одним артикулом путали бы и
 * покупателя, и подбор.
 */
export default async function NewProductPage() {
  await requireAdmin()

  const db = await getDb()
  const [manufacturers, balls] = await Promise.all([manufacturerNames(db), ballTypes(db)])

  return (
    <>
      <PageHead title="Новый фаркоп" lead="Которого нет в каталоге поставщика" />
      <PageBody>
        <p className="mb-5 max-w-3xl text-[13px] text-ink-muted">
          Если фаркоп уже есть в каталоге, а новая только машина — новый товар не нужен: найдите его в{' '}
          <Link href="/admin/tovary" className="text-accent hover:underline">
            «Товарах»
          </Link>{' '}
          и добавьте машину в «Подходит к». Нужной машины нет в списке —{' '}
          <Link href="/admin/mashiny" className="text-accent hover:underline">
            добавьте её в «Машинах»
          </Link>
          .
        </p>
        <NewProductForm manufacturers={manufacturers} balls={balls} />
      </PageBody>
    </>
  )
}
