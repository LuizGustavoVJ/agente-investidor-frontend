import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Layout from '@/components/Layout.vue'

const mountLayout = (errorHandler) =>
  mount(Layout, {
    global: {
      stubs: {
        'router-view': true
      },
      config: errorHandler ? { errorHandler } : {}
    }
  })

describe('Layout — usuario.nome nulo quebra o avatar', () => {
  it('nome hardcoded Jane renderiza inicial J', () => {
    const wrapper = mountLayout()

    expect(wrapper.vm.usuario.nome).toBe('Jane')
    expect(wrapper.find('.profile-avatar').text()).toBe('J')
    expect(wrapper.find('.profile-name').text()).toBe('Jane')
  })

  it('usuario.nome null lança TypeError no charAt do avatar', async () => {
    const renderErrors = []
    const wrapper = mountLayout((err) => {
      renderErrors.push(err)
    })

    wrapper.vm.usuario.nome = null
    await flushPromises()

    expect(renderErrors[0]).toBeInstanceOf(TypeError)
    expect(String(renderErrors[0])).toMatch(/charAt|null/)
    wrapper.unmount()
  })

  it('usuario.nome vazio não lança, mas o avatar fica em branco', async () => {
    const wrapper = mountLayout()

    wrapper.vm.usuario.nome = ''
    await flushPromises()

    expect(wrapper.find('.profile-avatar').text()).toBe('')
    wrapper.unmount()
  })
})
