import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  serial,
  text,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

/** Требуется ли вырез бампера. unknown — данных в источнике нет. */
export const bumperCutEnum = pgEnum('bumper_cut', ['not_required', 'required', 'unknown'])

/** Производители фаркопов: Steinhof, GALIA, Oris и т.д. */
export const manufacturers = pgTable('manufacturers', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  country: text('country'),
})

/** Марки автомобилей */
export const brands = pgTable(
  'brands',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    modelCount: integer('model_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [index('brands_published_idx').on(t.isPublished)],
)

/** Модели автомобилей */
export const models = pgTable(
  'models',
  {
    id: serial('id').primaryKey(),
    brandId: integer('brand_id')
      .notNull()
      .references(() => brands.id),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    variantCount: integer('variant_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
  },
  (t) => [uniqueIndex('models_brand_slug_idx').on(t.brandId, t.slug)],
)

/**
 * Кузова (поколения). hasOwnPage=false означает, что у модели это
 * единственный кузов и отдельная страница для него не создаётся —
 * иначе она дублировала бы страницу модели.
 */
export const variants = pgTable(
  'variants',
  {
    id: serial('id').primaryKey(),
    modelId: integer('model_id')
      .notNull()
      .references(() => models.id),
    slug: text('slug').notNull(),
    /** Очищенное название из источника, кириллицей: «Тойота РАВ4 XA10 1995-2000» */
    name: text('name').notNull(),
    /**
     * Чем это поколение отличается от соседних по модели, словами:
     * «3 МК IV универсал», «Классик седан», «Олроуд Кватро», XA10.
     *
     * Собирается buildVariantDescriptors: из name срезается общее для
     * модели начало (марка и модель) и годы — остаётся различие. Если
     * словами сказать нечего, подставляется латинский код поколения
     * из parseGeneration; если нет и его — null (у модели один кузов
     * либо в источнике, кроме годов, ничего нет).
     *
     * На страницах подпись собирается как
     * `${brand.name} ${model.name} ${generation ?? ''} ${годы}`, поэтому
     * марку и модель сюда класть нельзя: рядом с латинским «Toyota»
     * встало бы кириллическое «Тойота РАВ4».
     */
    generation: text('generation'),
    yearFrom: integer('year_from'),
    yearTo: integer('year_to'),
    sourceUrl: text('source_url'),
    productCount: integer('product_count').notNull().default(0),
    isPublished: boolean('is_published').notNull().default(false),
    hasOwnPage: boolean('has_own_page').notNull().default(false),
  },
  (t) => [uniqueIndex('variants_model_slug_idx').on(t.modelId, t.slug)],
)

/** Товары-фаркопы */
export const products = pgTable(
  'products',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    article: text('article').notNull(),
    manufacturerId: integer('manufacturer_id')
      .notNull()
      .references(() => manufacturers.id),
    description: text('description').notNull(),
    /** Цена из источника (фаркоп.рф). Розничная цена считается отдельно. */
    sourcePrice: integer('source_price').notNull(),
    deliveryText: text('delivery_text'),
    inStock: boolean('in_stock').notNull().default(false),
    ballType: text('ball_type'),
    towLoadKg: integer('tow_load_kg'),
    verticalLoadKg: integer('vertical_load_kg'),
    weightKg: real('weight_kg'),
    bumperCut: bumperCutEnum('bumper_cut').notNull().default('unknown'),
    /** null означает, что данных в источнике нет */
    electricsIncluded: boolean('electrics_included'),
    sourceUrl: text('source_url'),
    images: jsonb('images').$type<string[]>().notNull().default([]),
    documents: jsonb('documents').$type<{ url: string; label: string }[]>().notNull().default([]),
  },
  (t) => [index('products_manufacturer_idx').on(t.manufacturerId)],
)

/** Связка «этот фаркоп подходит к этому кузову» */
export const fitments = pgTable(
  'fitments',
  {
    id: serial('id').primaryKey(),
    productId: integer('product_id')
      .notNull()
      .references(() => products.id),
    variantId: integer('variant_id')
      .notNull()
      .references(() => variants.id),
    price: integer('price'),
    deliveryText: text('delivery_text'),
  },
  (t) => [
    uniqueIndex('fitments_product_variant_idx').on(t.productId, t.variantId),
    index('fitments_variant_idx').on(t.variantId),
  ],
)

export type Manufacturer = typeof manufacturers.$inferSelect
export type Brand = typeof brands.$inferSelect
export type Model = typeof models.$inferSelect
export type Variant = typeof variants.$inferSelect
export type Product = typeof products.$inferSelect
export type Fitment = typeof fitments.$inferSelect

/* ────────────────────────────────────────────────────────────────────
   Слой правок владельца
   ────────────────────────────────────────────────────────────────────

   Всё, что ниже, заполняет не импорт, а человек через админку.

   Главное правило: правки лежат ОТДЕЛЬНО от товаров. Импорт нового
   прайса перезаписывает products целиком — если писать цену владельца
   прямо туда, она исчезнет при первом же обновлении. Поэтому правка
   хранится рядом и накладывается поверх выгрузки при сборке.
*/

/** Что именно правили — для журнала и для адресной пересборки. */
export const overrideEntityEnum = pgEnum('override_entity', [
  'product',
  'review',
  'promo',
  'work',
  'install_price',
  'electrics',
  'faq',
  'contacts',
  'ball_photo',
])

/**
 * Правка владельца: одно поле одной сущности.
 *
 * Хранится построчно, а не целым объектом, по двум причинам. Видно,
 * что именно человек изменил, а что оставил из выгрузки — иначе через
 * полгода не отличить «он поставил такую же цену» от «он её не
 * трогал». И при импорте можно показать «поставщик изменил цену, у вас
 * стоит своя» только по тем полям, которые реально правили.
 *
 * value хранится строкой: поля разного типа, а разбор на стороне
 * чтения дешевле, чем девять колонок под разные типы.
 */
export const overrides = pgTable(
  'overrides',
  {
    id: serial('id').primaryKey(),
    entity: overrideEntityEnum('entity').notNull(),
    /** Кого правим: slug товара, id отзыва и т.д. Для одиночек вроде контактов — 'self'. */
    targetKey: text('target_key').notNull(),
    field: text('field').notNull(),
    value: text('value'),
    /** Кто и когда — для журнала публикаций. */
    author: text('author').notNull(),
    updatedAt: text('updated_at').notNull(),
    /** Уехало ли на сайт. Правки копятся и публикуются пачкой. */
    published: boolean('published').notNull().default(false),
  },
  (t) => [
    uniqueIndex('overrides_target_idx').on(t.entity, t.targetKey, t.field),
    index('overrides_unpublished_idx').on(t.published),
  ],
)

/**
 * Товар, которого нет в выгрузке поставщика.
 *
 * Полностью под владельцем: другие поставщики, б/у, своя сварка.
 * Импорт его не трогает никогда.
 */
export const ownProducts = pgTable('own_products', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  article: text('article').notNull(),
  manufacturerName: text('manufacturer_name').notNull(),
  description: text('description').notNull().default(''),
  price: integer('price').notNull(),
  inStock: boolean('in_stock').notNull().default(true),
  ballType: text('ball_type'),
  towLoadKg: integer('tow_load_kg'),
  verticalLoadKg: integer('vertical_load_kg'),
  bumperCut: bumperCutEnum('bumper_cut').notNull().default('unknown'),
  /** К каким кузовам подходит — slug'и через запятую, правятся в карточке. */
  variantSlugs: jsonb('variant_slugs').$type<string[]>().notNull().default([]),
  createdAt: text('created_at').notNull(),
})

/**
 * Заявка с сайта.
 *
 * Лежит здесь, а не уходит только письмом: владельцу нужно видеть,
 * кому он уже звонил, а почта этого не помнит.
 *
 * Персональные данные. По 152-ФЗ таблица обязана находиться на сервере
 * в России — это решает выбор хостинга под админку, а не код.
 */
export const requests = pgTable(
  'requests',
  {
    id: serial('id').primaryKey(),
    name: text('name'),
    phone: text('phone').notNull(),
    car: text('car'),
    comment: text('comment'),
    /** Откуда пришла: адрес страницы. Видно, что человек смотрел. */
    page: text('page'),
    status: text('status').notNull().default('new'),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('requests_status_idx').on(t.status)],
)

/** Вход в админку. Один владелец, ролей нет — заводить их незачем. */
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  login: text('login').notNull().unique(),
  /** Хеш, не пароль. В базе пароля быть не должно даже у себя. */
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
})

export type Override = typeof overrides.$inferSelect
export type OwnProduct = typeof ownProducts.$inferSelect
export type Request = typeof requests.$inferSelect
export type AdminUser = typeof adminUsers.$inferSelect

/* ────────────────────────────────────────────────────────────────────
   Списки, которые ведёт владелец
   ────────────────────────────────────────────────────────────────────

   Отличаются от overrides тем, что это не правка существующего, а
   записи, которых в коде нет вовсе: отзыв, акция, снимок работы.
   Править поле чужой строки и завести свою строку — разные действия, и
   таблица «поле → значение» второе не удержит.

   Поле `visible` — это «показывать на сайте», решение владельца.
   Не путать с `published` в overrides: то про очередь публикации,
   то есть «уехало ли на витрину». Запись может быть visible, но ещё
   не опубликованной — пока не пересобраны страницы.
*/

/**
 * Отзыв.
 *
 * Средняя оценка и число отзывов тут не хранятся: они лежат правкой
 * (entity 'review', ключ 'self'). Считать среднее по этой таблице
 * нельзя — на картах и Авито отзывов в разы больше, чем перенесут
 * сюда, и посчитанная цифра разошлась бы с настоящей.
 */
export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    author: text('author').notNull(),
    /** Машина, про которую отзыв. Пусто — не показывается. */
    car: text('car').notNull().default(''),
    text: text('text').notNull(),
    /** Как показывать дату: «Сентябрь 2026». Не для сортировки. */
    date: text('date').notNull().default(''),
    visible: boolean('visible').notNull().default(true),
    /** Порядок показа. Меньше — выше. */
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('reviews_visible_idx').on(t.visible)],
)

/**
 * Акция.
 *
 * Две формы в одной таблице: у обычной есть размер скидки строкой, у
 * списочной — перечень «модель → скидка». Разделять на две таблицы
 * незачем: отличаются они одним полем из восьми.
 *
 * `until` хранится датой, а не только подписью. Строка «До 31 августа»
 * сама истечь не может — так уже было, и она провисела до октября.
 */
export const promos = pgTable(
  'promos',
  {
    id: serial('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    lead: text('lead').notNull().default(''),
    /** 'text' — скидка строкой, 'list' — перечень позиций. */
    kind: text('kind').notNull().default('text'),
    discount: text('discount').notNull().default(''),
    discountNote: text('discount_note').notNull().default(''),
    items: jsonb('items').$type<{ model: string; discount: string }[]>().notNull().default([]),
    /** ГГГГ-ММ-ДД или пусто — бессрочная. */
    until: text('until'),
    visible: boolean('visible').notNull().default(true),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('promos_visible_idx').on(t.visible)],
)

/**
 * Снимок выполненной работы.
 *
 * Девятнадцать снимков уже лежат в коде (src/content/works.ts) — это
 * настоящие фотографии из сервиса. Здесь копятся те, что владелец
 * добавит сам; на сайте оба списка показываются вместе.
 */
export const works = pgTable(
  'works',
  {
    id: serial('id').primaryKey(),
    /** Марка и модель по шильдику либо описание крупного плана. */
    car: text('car').notNull(),
    /** Производитель фаркопа — только если виден на снимке. */
    article: text('article').notNull().default(''),
    /** Адрес файла в public: /images/own/… */
    photo: text('photo').notNull(),
    /** Страница фаркопов для этой машины. Пусто — снимок без ссылки. */
    href: text('href').notNull().default(''),
    visible: boolean('visible').notNull().default(true),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('works_visible_idx').on(t.visible)],
)

/**
 * Фото товара, загруженные владельцем.
 *
 * Фото два вида, и разница в том, кому их показывать:
 *
 * - общие (model_key = '') — сам фаркоп: шар, крепёж, коробка. Один
 *   артикул подходит к нескольким машинам, и эти фото видны на всех;
 * - на машине (model_key = 'audi/q7') — фаркоп, поставленный на эту
 *   модель. Их видит только тот, кто смотрит эту машину: покупателю
 *   Cayenne снимок с Q7 вместо своей машины только мешает.
 *
 * Привязка к модели, а не к кузову: поколения одной модели снаружи
 * обычно отличаются мало, а владельцу выбрать «Audi Q7» проще, чем
 * «Q7 4M 2015–2020».
 */
export const productPhotos = pgTable(
  'product_photos',
  {
    id: serial('id').primaryKey(),
    productSlug: text('product_slug').notNull(),
    /** '' — общие фото; иначе «марка/модель» слагами, как в адресах каталога. */
    modelKey: text('model_key').notNull().default(''),
    /** Адрес файла в public: /images/own/… */
    url: text('url').notNull(),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('product_photos_slug_idx').on(t.productSlug, t.modelKey, t.position)],
)

export type Review = typeof reviews.$inferSelect
export type Promo = typeof promos.$inferSelect
export type Work = typeof works.$inferSelect

/**
 * Вопрос и ответ, добавленный владельцем.
 *
 * Десять вопросов уже лежат в коде (src/content/faq.ts) — их тексты
 * выверены и местами привязаны к другим страницам: сроки в ответе про
 * установку обязаны совпадать с таблицей сроков. Поэтому прежние
 * правятся слоем правок, а здесь копятся только новые.
 *
 * `scope` делит их на два списка: вопросы про установку показываются на
 * главной и на странице установки, вопросы про подбор — в каталоге.
 * Человек в каталоге ещё выбирает деталь, и ответы про гарантию на
 * работы ему не нужны.
 */
export const faq = pgTable(
  'faq',
  {
    id: serial('id').primaryKey(),
    /** 'home' — главная и установка, 'catalog' — страница каталога. */
    scope: text('scope').notNull().default('home'),
    question: text('question').notNull(),
    answer: text('answer').notNull().default(''),
    visible: boolean('visible').notNull().default(true),
    position: integer('position').notNull().default(0),
    createdAt: text('created_at').notNull(),
  },
  (t) => [index('faq_scope_idx').on(t.scope, t.visible)],
)

export type FaqRow = typeof faq.$inferSelect
