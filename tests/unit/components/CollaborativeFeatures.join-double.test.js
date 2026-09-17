import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import CollaborativeFeatures from '@/components/CollaborativeFeatures.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn(),
    data: { datasets: [] },
    options: {}
  }))
}))

describe('CollaborativeFeatures — join de grupo e competição', () => {
  let wrapper
  let alertSpy

  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    wrapper = mount(CollaborativeFeatures, {
      global: {
        plugins: [pinia]
      }
    })
  })

  afterEach(() => {
    wrapper?.unmount()
    alertSpy?.mockRestore()
  })

  it('joinGroup só mostra alerta e não adiciona o grupo à lista do usuário', () => {
    const recommended = wrapper.vm.recommendedGroups.find((group) => !group.isPrivate)
    const myGroupsBefore = wrapper.vm.myGroups.length
    const membersBefore = recommended.members

    wrapper.vm.joinGroup(recommended)

    expect(alertSpy).toHaveBeenCalledWith(`Entrando no grupo: ${recommended.name}`)
    expect(wrapper.vm.myGroups).toHaveLength(myGroupsBefore)
    expect(wrapper.vm.myGroups.some((group) => group.id === recommended.id)).toBe(false)
    expect(recommended.members).toBe(membersBefore)
  })

  it('joinGroup em grupo privado também não incrementa membros nem cria pedido', () => {
    const privateGroup = wrapper.vm.recommendedGroups.find((group) => group.isPrivate)
    const membersBefore = privateGroup.members

    wrapper.vm.joinGroup(privateGroup)

    expect(alertSpy).toHaveBeenCalledWith(`Solicitando entrada no grupo: ${privateGroup.name}`)
    expect(privateGroup.members).toBe(membersBefore)
    expect(privateGroup.pendingRequest).toBeUndefined()
    expect(wrapper.vm.myGroups.some((group) => group.id === privateGroup.id)).toBe(false)
  })

  it('joinCompetition em competição já inscrita incrementa participantes de novo', () => {
    const alreadyIn = wrapper.vm.activeCompetitions.find((item) => item.isParticipating)
    const participantsBefore = alreadyIn.participants

    wrapper.vm.joinCompetition(alreadyIn)
    wrapper.vm.joinCompetition(alreadyIn)

    expect(alreadyIn.isParticipating).toBe(true)
    expect(alreadyIn.participants).toBe(participantsBefore + 2)
  })

  it('getCategoryName desconhecida devolve string vazia', () => {
    expect(wrapper.vm.getCategoryName('categoria-inexistente')).toBe('')
  })
})
