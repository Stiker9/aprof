/**
 * Вставка микроразметки JSON-LD.
 *
 * Отдельный компонент из-за одной тонкости: JSON кладётся внутрь
 * <script>, и строка «</script>» в любом тексте — описании товара,
 * ответе в FAQ — закрыла бы тег раньше времени. Тексты правит владелец
 * в админке, так что исключить это нельзя. Поэтому «<» экранируется
 * в <: для JSON это тот же символ, для HTML — уже не тег.
 *
 * Пустые элементы (null) отбрасываются — построители в ./schema
 * возвращают null, когда размечать нечего.
 */
type Schema = Record<string, unknown> | null | undefined

export function JsonLd({ data }: { data: Schema | Schema[] }) {
  const items = (Array.isArray(data) ? data : [data]).filter(Boolean)
  if (items.length === 0) return null
  const json = JSON.stringify(items.length === 1 ? items[0] : items).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
