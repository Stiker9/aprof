import { countProducts, listBrands } from '@/catalog/queries'
import { Brands } from '@/components/home/brands'
import { Hero } from '@/components/home/hero'
import { getDb } from '@/db/client'

export default async function HomePage() {
  const db = await getDb()
  const [brands, totalProducts] = await Promise.all([listBrands(db), countProducts(db)])
  const popular = [...brands].sort((a, b) => b.productCount - a.productCount).slice(0, 24)

  return (
    <main>
      <Hero productCount={totalProducts} />
      <Brands brands={popular} totalBrands={brands.length} />
    </main>
  )
}
