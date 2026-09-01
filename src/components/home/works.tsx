import { urls } from '@/catalog/urls'
import { WorksGallery, type GalleryWork } from '@/components/home/works-gallery'

/**
 * Наши работы на главной.
 *
 * Снимки настоящие, с подъёмника. Марки определены по шильдикам на самих
 * фотографиях, а не выдуманы.
 *
 * Артикул фаркопа нигде не подписан: на снимках его почти никогда не
 * видно, а выдумывать номер на сайте, где по нему подбирают деталь,
 * нельзя. Исключение — снимки, где марка ТСУ читается на кронштейне.
 *
 * Тип кузова проставлен руками: в базе снимков такого поля нет, а фильтру
 * в галерее он нужен.
 *
 * focus — доля высоты снимка, на которой стоит фаркоп. Замерено по
 * контрольному листу со всеми двенадцатью фотографиями: разброс от
 * 0.61 до 0.73. В галерее по этой точке кадрируется и крупный снимок,
 * и миниатюра.
 *
 * ═══ ВНИМАНИЕ: поле `use` — ЗАГЛУШКА ═══
 *
 * Заказчик показал сайт конкурента, где у каждого снимка подписано, зачем
 * ставили фаркоп: «Для перевозки велосипедов на Zeekr X». Он попросил
 * такие же и сказал, что поправит их сам в админке.
 *
 * Мы этого не знаем. На снимках назначение не написано, и вывести его
 * неоткуда — значения ниже расставлены по типу машины как образец
 * разметки, не более. Универсал получил грузовой прицеп, премиальные
 * кроссоверы — велокрепление, и так далее. Это правдоподобно, но не
 * правда, и до правки заказчиком выдавать их за факт нельзя.
 *
 * Поле `cta` — надпись на кнопке. Тут выдумки нет: это наши слова, они
 * ничего не утверждают о снимке. Разные намеренно, чтобы двенадцать
 * одинаковых кнопок не читались шаблоном.
 */
const WORKS: GalleryWork[] = [
  {
    car: 'Mazda CX-5',
    photo: '/images/gallery/mazda-cx5.webp',
    href: urls.model('mazda', 'cx-5'),
    body: 'Кроссоверы',
    focus: 0.64,
    use: 'Для перевозки прицепа',
    cta: 'Подобрать фаркоп',
  },
  {
    car: 'Chery Tiggo 8 Pro Max',
    photo: '/images/gallery/chery-tiggo-8-pro-max.webp',
    href: urls.model('chery', 'tiggo-8-pro-max'),
    body: 'Кроссоверы',
    focus: 0.69,
    use: 'Под велокрепление',
    cta: 'Купить фаркоп',
  },
  {
    car: 'Skoda Superb',
    photo: '/images/gallery/skoda-superb.webp',
    href: urls.model('skoda', 'superb'),
    body: 'Седаны',
    focus: 0.63,
    use: 'Для дачного прицепа',
    cta: 'Нужен такой же',
  },
  {
    car: 'Geely Belgee X70',
    photo: '/images/gallery/geely-belgee-x70.webp',
    href: urls.model('geely', 'belgee-x70'),
    body: 'Кроссоверы',
    focus: 0.61,
    use: 'Для перевозки прицепа',
    cta: 'Заказать фаркоп',
  },
  {
    car: 'Audi SQ8',
    photo: '/images/gallery/audi-sq8.webp',
    href: urls.model('audi', 'q8'),
    body: 'Кроссоверы',
    focus: 0.67,
    use: 'Под велокрепление',
    cta: 'Подобрать на свою',
  },
  {
    car: 'Lexus NX',
    photo: '/images/gallery/lexus-nx.webp',
    href: urls.model('lexus', 'nx'),
    body: 'Кроссоверы',
    focus: 0.65,
    use: 'Для лодочного прицепа',
    cta: 'Купить фаркоп',
  },
  {
    car: 'Kia Rio',
    photo: '/images/gallery/kia-rio.webp',
    href: urls.model('kia', 'rio'),
    body: 'Седаны',
    focus: 0.69,
    use: 'Для дачного прицепа',
    cta: 'Заказать фаркоп',
  },
  {
    car: 'Renault Duster',
    photo: '/images/gallery/renault-duster.webp',
    href: urls.model('renault', 'duster'),
    body: 'Кроссоверы',
    focus: 0.73,
    use: 'Для перевозки прицепа',
    cta: 'Нужен такой же',
  },
  {
    car: 'Skoda Rapid',
    photo: '/images/gallery/skoda-rapid.webp',
    href: urls.model('skoda', 'rapid'),
    body: 'Седаны',
    focus: 0.69,
    use: 'Для лодочного прицепа',
    cta: 'Подобрать фаркоп',
  },
  {
    car: 'Lada Largus',
    photo: '/images/gallery/lada-largus.webp',
    href: urls.model('lada', 'largus'),
    body: 'Универсалы',
    focus: 0.7,
    use: 'Для грузового прицепа',
    cta: 'Купить фаркоп',
  },
  {
    car: 'BMW X6',
    photo: '/images/gallery/bmw-x6.webp',
    href: urls.model('bmw', 'x6'),
    body: 'Кроссоверы',
    focus: 0.7,
    use: 'Под велокрепление',
    cta: 'Заказать и записаться',
  },
  {
    car: 'Nissan X-Trail',
    photo: '/images/gallery/nissan-x-trail.webp',
    href: urls.model('nissan', 'x-trail'),
    body: 'Кроссоверы',
    focus: 0.7,
    use: 'Для перевозки прицепа',
    cta: 'Подобрать на свою',
  },
]

export function Works() {
  return <WorksGallery works={WORKS} allHref="/nashi-raboty" total="3 800+" />
}
