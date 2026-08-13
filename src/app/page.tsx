import { countProducts, listBrands } from '@/catalog/queries'
import { About } from '@/components/home/about'
import { Brands } from '@/components/home/brands'
import { Contacts } from '@/components/home/contacts'
import { Faq } from '@/components/home/faq'
import { Hero } from '@/components/home/hero'
import { InstallDelivery } from '@/components/home/install-delivery'
import { Promos } from '@/components/home/promos'
import { Works } from '@/components/home/works'
import { getDb } from '@/db/client'

export default async function HomePage() {
  const db = await getDb()
  // Число товаров считается отдельным запросом, а не суммой по маркам:
  // один фаркоп подходит к машинам разных марок, и сумма счётчиков
  // насчитывает 7 339 вместо 5 808.
  const [brands, totalProducts] = await Promise.all([listBrands(db), countProducts(db)])
  const popular = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 24)
  // Модели складываются по всем маркам, а не по показанным двадцати
  // четырём: модель принадлежит ровно одной марке, так что сумма честная.
  const totalModels = brands.reduce((sum, brand) => sum + brand.modelCount, 0)

  return (
    <main>
      <Hero productCount={totalProducts} />
      <Brands brands={popular} totalBrands={brands.length} totalModels={totalModels} />
      <Promos />
      <InstallDelivery />
      <Works />
      <About />
      <Faq />
      <Contacts />
    </main>
  )
}
