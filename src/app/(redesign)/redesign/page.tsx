import { countProducts, listBrands } from '@/catalog/queries'
import { About } from '@/redesign/components/home/about'
import { Brands } from '@/redesign/components/home/brands'
import { Contacts } from '@/redesign/components/home/contacts'
import { Faq } from '@/redesign/components/home/faq'
import { Hero } from '@/redesign/components/home/hero'
import { InstallDelivery } from '@/redesign/components/home/install-delivery'
import { Promos } from '@/redesign/components/home/promos'
import { Works } from '@/redesign/components/home/works'
import { getDb } from '@/db/client'

export default async function HomePage() {
  const db = await getDb()
  // Число товаров считается отдельным запросом, а не суммой по маркам:
  // один фаркоп подходит к машинам разных марок, и сумма счётчиков
  // насчитывает 7 339 вместо 5 808.
  const [brands, totalProducts] = await Promise.all([listBrands(db), countProducts(db)])
  const popular = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 24)

  return (
    // Секции идут встык: страница — сплошное полотно, а не стопка плиток
    <main className="flex flex-col">
      <Hero productCount={totalProducts} />
      <Brands brands={popular} totalBrands={brands.length} />
      <Promos />
      <InstallDelivery />
      <Works />
      <About />
      <Faq />
      <Contacts />
    </main>
  )
}
