import { requireAdmin } from '@/admin/auth'
import { PageBody, PageHead } from '@/components/admin/page-head'
import { PasswordForm } from '@/components/admin/password-form'

export default async function PasswordPage() {
  const session = await requireAdmin()

  return (
    <>
      <PageHead title="Пароль" lead={`Вход под логином ${session.login}`} />
      <PageBody>
        <PasswordForm />

        <p className="mt-4 max-w-sm text-[12px] text-ink-dim">
          Пароль в базе не хранится — только его отпечаток, из которого обратно пароль не
          восстановить. Поэтому забытый пароль нельзя подсмотреть, его можно только выдать заново.
        </p>
      </PageBody>
    </>
  )
}
