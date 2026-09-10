import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Layout from '@/components/Layout.vue'
import { useAuthStore } from '@/stores/auth'

describe('Layout — identidade do usuário', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('renderiza Jane hardcoded e ignora o usuário da auth store', () => {
    const authStore = useAuthStore()
    authStore.user = { id: 'u-99', name: 'Carlos Souza', email: 'carlos@email.com' }

    const wrapper = mount(Layout, {
      global: {
        stubs: {
          'router-view': true
        }
      }
    })

    expect(wrapper.text()).toContain('Jane')
    expect(wrapper.find('.profile-name').text()).toBe('Jane')
    expect(wrapper.find('.profile-avatar').text()).toBe('J')
    expect(wrapper.text()).not.toContain('Carlos')
  })
})
