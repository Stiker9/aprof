/**
 * Пометка о черновике.
 *
 * Стоит на правовых страницах, где текст написан по типовой структуре,
 * а реквизиты — нули. Без такой пометки страница выглядит готовой, и
 * её легко выпустить в интернет: со стороны черновая политика
 * конфиденциальности неотличима от настоящей, а разница в том, что по
 * ней заказчик отвечает перед Роскомнадзором.
 *
 * Убирается вместе с настоящими данными и проверкой юриста.
 */
export function DraftNotice({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 rounded-[var(--radius-card)] border border-accent/30 bg-accent-soft px-6 py-5 text-sm text-ink-dark">
      <strong className="font-semibold">Черновик.</strong> {children}
    </div>
  )
}
