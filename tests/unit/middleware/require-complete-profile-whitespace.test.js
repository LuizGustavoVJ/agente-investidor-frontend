import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { requireCompleteProfile } from '@/middleware/auth'

describe('requireCompleteProfile — whitespace conta como campo preenchido', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('name/email/phone só com espaços passam no every(field => user[field]) e não vão para ProfileSetup', async () => {
    const authStore = useAuthStore()
    authStore.user = { name: '   ', email: '  ', phone: '   ' }

    const next = vi.fn()
    await requireCompleteProfile({ fullPath: '/dashboard' }, {}, next)

    expect(authStore.isAuthenticated).toBe(true)
    expect(next).toHaveBeenCalledTimes(1)
    expect(next.mock.calls[0]).toEqual([])
    expect(next).not.toHaveBeenCalledWith(
      expect.objectContaining({ name: 'ProfileSetup' })
    )
  })

  it('string vazia é incompleta, mas o guard não faz trim — "João" + email/phone vazios redireciona', async () => {
    const authStore = useAuthStore()
    authStore.user = { name: 'João', email: '', phone: '' }

    const next = vi.fn()
    await requireCompleteProfile({ fullPath: '/corretoras' }, {}, next)

    expect(next).toHaveBeenCalledWith({
      name: 'ProfileSetup',
      query: { redirect: '/corretoras' }
    })
  })
})
