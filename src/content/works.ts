import { urls } from '@/catalog/urls'
import { ownWorks } from './lists'

/**
 * Галерея выполненных работ.
 *
 * ── Два источника, один список ──
 *
 * BASE_WORKS — девятнадцать снимков, снятых в сервисе на подъёмнике.
 * Они лежат в коде, потому что подписи к ним сверены по шильдикам на
 * самих фотографиях, а не записаны со слов. Править их текстовым полем
 * в админке нельзя: так под снимком «Шкоды» однажды оказалась бы
 * «Ауди».
 *
 * Дальше идёт то, что владелец добавил сам. Его снимки показываются
 * после прежних: так видно, что добавилось, и новая работа не
 * перемешивается со старыми.
 *
 * ── Про подписи ──
 *
 * Марки указаны по шильдикам на самих фотографиях, а не выдуманы.
 * Модель фаркопа проставлена только там, где её видно на снимке
 * (шильдик или наклейка на кронштейне): подписывать артикул наугад для
 * сайта, где по нему подбирают деталь, значит вводить человека в
 * заблуждение.
 *
 * Порядок не случайный: светлые и тёмные кузова чередуются. Подряд
 * несколько белых машин в сетке сливаются в одно пятно.
 *
 * Три кадра — крупные планы самого узла без машины в кадре; у них в
 * подписи стоит то, что на них изображено.
 */
export interface WorkItem {
  /** Марка и модель по шильдику, либо описание для крупного плана. */
  car: string
  /** Производитель фаркопа — только если виден на снимке. */
  article?: string
  photo: string
  /**
   * Страница фаркопов для этой машины. Необязателен: у крупных планов
   * узла машины в кадре нет, а у Mercedes не удалось определить модель
   * по шильдику — вести такие снимки некуда.
   */
  href?: string
}

export const BASE_WORKS: WorkItem[] = [
  { car: 'Chery Tiggo 8 Pro Max', photo: '/images/gallery/chery-tiggo-8-pro-max.webp', href: urls.model('chery', 'tiggo-8-pro-max') },
  { car: 'Mazda CX-5', photo: '/images/gallery/mazda-cx5.webp', href: urls.model('mazda', 'cx-5') },
  { car: 'Geely Belgee X70', photo: '/images/gallery/geely-belgee-x70.webp', href: urls.model('geely', 'belgee-x70') },
  { car: 'Skoda Superb', photo: '/images/gallery/skoda-superb.webp', href: urls.model('skoda', 'superb') },
  { car: 'Lexus NX', photo: '/images/gallery/lexus-nx.webp', href: urls.model('lexus', 'nx') },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8.webp', href: urls.model('audi', 'q8') },
  { car: 'BMW X6', photo: '/images/gallery/bmw-x6.webp', href: urls.model('bmw', 'x6') },
  { car: 'Renault Duster', photo: '/images/gallery/renault-duster.webp', href: urls.model('renault', 'duster') },
  { car: 'Haval F7', photo: '/images/gallery/haval-f7.webp', href: urls.model('haval', 'f7') },
  { car: 'Mercedes-Benz', photo: '/images/gallery/mercedes-benz.webp' },
  { car: 'Nissan X-Trail', photo: '/images/gallery/nissan-x-trail.webp', href: urls.model('nissan', 'x-trail') },
  { car: 'Kia Rio', photo: '/images/gallery/kia-rio.webp', href: urls.model('kia', 'rio') },
  { car: 'Haval M6', photo: '/images/gallery/haval-m6.webp', href: urls.model('haval', 'm6') },
  { car: 'Skoda Rapid', photo: '/images/gallery/skoda-rapid.webp', href: urls.model('skoda', 'rapid') },
  { car: 'Lada Largus', photo: '/images/gallery/lada-largus.webp', href: urls.model('lada', 'largus') },
  { car: 'Audi SQ8', photo: '/images/gallery/audi-sq8-2.webp', href: urls.model('audi', 'q8') },
  { car: 'Фаркоп с розеткой', article: 'Motodor', photo: '/images/gallery/detal-motodor.webp' },
  { car: 'Шар и посадочный квадрат', photo: '/images/gallery/detal-sharovaya.webp' },
  { car: 'Lada Largus', article: 'Berg', photo: '/images/gallery/detal-berg-largus.webp' },
]

/** Всё, что показывается в галерее: свои снимки и добавленные владельцем. */
export const WORKS: WorkItem[] = [
  ...BASE_WORKS,
  ...ownWorks().map((work) => ({
    car: work.car,
    article: work.article || undefined,
    photo: work.photo,
    href: work.href || undefined,
  })),
]
