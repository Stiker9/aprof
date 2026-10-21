/**
 * Полоса цифр под первым экраном.
 *
 * Четыре факта, которые можно подтвердить: сколько установок сделано,
 * сколько лет сервису, гарантия и средний срок работ. Стоит сразу после
 * фотографии, потому что именно в этот момент человек решает, читать
 * дальше или уйти: цифры отвечают на «а вы вообще кто» быстрее любого
 * абзаца.
 *
 * Тёмная, как и первый экран: две тёмные полосы подряд не сливаются,
 * потому что первая — снимок, а вторая — плоский фон.
 */
const FACTS = [
  { value: '3 800+', caption: 'установок с 2014 года' },
  { value: '12 лет', caption: 'на 1-й Жерновской' },
  { value: '2 года', caption: 'гарантии на работы' },
  { value: '3 часа', caption: 'средняя установка' },
]

export function Numbers() {
  return (
    <section className="border-t border-white/8 bg-surface text-ink">
      <div className="grid grid-cols-2 gap-x-8 gap-y-8 px-5 py-10 sm:px-8 lg:grid-cols-4 lg:px-14 lg:py-12">
        {FACTS.map((fact) => (
          <div key={fact.caption} className="flex flex-col gap-2">
            <span className="font-[family-name:var(--font-display)] text-[clamp(26px,2.6vw,38px)] leading-none tracking-[-0.02em]">
              {fact.value}
            </span>
            <span className="text-[13px] leading-[1.4] text-ink-muted">{fact.caption}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
