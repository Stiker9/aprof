'use client'

import { useActionState } from 'react'
import { changePassword } from '@/admin/actions'

/**
 * Смена пароля.
 *
 * Старый пароль спрашивается обязательно — иначе любой, кто подсел за
 * незапертый ноутбук, меняет пароль и запирает владельца снаружи.
 *
 * Повтор нового тоже обязателен: опечатку в поле с точками не видно, а
 * узнать о ней получилось бы только при следующем входе, когда менять
 * пароль уже некем.
 *
 * `new-password` в автозаполнении — подсказка менеджеру паролей, что
 * здесь надо предложить сгенерировать новый и сохранить его, а не
 * подставить текущий.
 */
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {})

  if (state.done) {
    return (
      <p className="rounded-card border border-in-stock/40 bg-in-stock/8 px-5 py-4 text-[14px]">
        Пароль изменён. Он понадобится при следующем входе — печенька этого входа действует неделю.
      </p>
    )
  }

  return (
    <form action={action} className="max-w-sm rounded-card border border-line-light bg-white p-5">
      <label className="mb-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Текущий пароль</span>
        <input
          name="current"
          type="password"
          className="ctl"
          autoComplete="current-password"
          required
          disabled={pending}
        />
      </label>

      <label className="mb-3 block">
        <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Новый пароль</span>
        <input
          name="next"
          type="password"
          className="ctl"
          autoComplete="new-password"
          minLength={10}
          required
          disabled={pending}
        />
        <span className="mt-1 block text-[11px] text-ink-dim">От десяти знаков.</span>
      </label>

      <label className="block">
        <span className="mb-1 block text-[12px] font-semibold text-ink-muted">
          Новый пароль ещё раз
        </span>
        <input
          name="repeat"
          type="password"
          className="ctl"
          autoComplete="new-password"
          required
          disabled={pending}
        />
      </label>

      {state.error && (
        <p className="mt-3 rounded-lg bg-accent-soft px-3 py-2 text-[13px] text-accent">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
      >
        {pending ? 'Меняю…' : 'Сменить пароль'}
      </button>
    </form>
  )
}
