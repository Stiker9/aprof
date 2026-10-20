'use client'

import { useActionState } from 'react'
import { login, type LoginState } from '@/admin/actions'

/**
 * Форма входа.
 *
 * `useActionState` вместо своего обработчика: так форма работает и без
 * JavaScript — браузер отправит её обычным POST, действие выполнится на
 * сервере, страница вернётся с ошибкой в том же месте. Для админки,
 * которую открывают с телефона в мастерской по слабой связи, это не
 * теория: скрипты грузятся последними.
 *
 * Автозаполнение помечено `current-password`, чтобы менеджер паролей
 * понял, что это вход, а не регистрация, и не предложил придумать
 * новый.
 */
export function LoginForm({ hasUser }: { hasUser: boolean }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {})

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="block font-[family-name:var(--font-display)] text-lg font-bold tracking-tight">
            VASHFARKOP
          </span>
          <span className="block text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            панель управления
          </span>
        </div>

        {hasUser ? (
          <form
            action={action}
            className="rounded-block border border-line-light bg-white p-6 shadow-[0_1px_2px_rgb(20_20_22/0.04),0_8px_24px_-12px_rgb(20_20_22/0.12)]"
          >
            <label className="mb-3 block">
              <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Логин</span>
              <input
                name="login"
                className="ctl"
                autoComplete="username"
                autoFocus
                required
                disabled={pending}
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[12px] font-semibold text-ink-muted">Пароль</span>
              <input
                name="password"
                type="password"
                className="ctl"
                autoComplete="current-password"
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
              {pending ? 'Проверяю…' : 'Войти'}
            </button>
          </form>
        ) : (
          <div className="rounded-block border border-line-light bg-white p-6">
            <p className="font-semibold">Пользователь ещё не создан</p>
            <p className="mt-2 text-[13px] text-ink-muted">
              Заведите владельца и получите пароль — команда покажет его один раз:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-lg bg-paper-2 px-3 py-2 text-[12px]">
              npm run admin:user -- vladelec
            </pre>
            <p className="mt-3 text-[12px] text-ink-dim">
              Пароль генерируется сам. В аргументе команды его передавать нельзя — он останется в
              истории оболочки и в списке процессов.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
