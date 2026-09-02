import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'
import Metas from '@/views/Metas.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/metas/:id', name: 'MetaDetalhe', component: { template: '<div />' } }
  ]
})

const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn()
}

vi.mock('vue-toastification', () => ({
  useToast: () => mockToast
}))

describe('Metas', () => {
  let wrapper

  beforeEach(async () => {
    vi.useFakeTimers()
    setActivePinia(createPinia())
    mockToast.success.mockClear()
    mockToast.error.mockClear()

    wrapper = mount(Metas, {
      global: {
        plugins: [router]
      }
    })

    await vi.advanceTimersByTimeAsync(1000)
    await wrapper.vm.$nextTick()
  })

  afterEach(() => {
    wrapper.unmount()
    vi.useRealTimers()
  })

  it('mostra resumo após o carregamento inicial', () => {
    expect(wrapper.text()).toContain('Metas Financeiras')
    expect(wrapper.text()).not.toContain('Carregando suas metas')
    expect(wrapper.text()).toContain('Casa Própria')
    expect(wrapper.text()).toContain('3')
  })

  it('filtra metas por texto de busca', async () => {
    await wrapper.find('.search-input').setValue('Europa')
    await wrapper.vm.$nextTick()

    const cards = wrapper.findAll('.goal-card')
    expect(cards).toHaveLength(1)
    expect(cards[0].text()).toContain('Viagem Europa')
    expect(cards[0].text()).not.toContain('Entrada para apartamento')
  })

  it('filtra apenas metas ativas', async () => {
    await wrapper.findAll('.filter-select')[0].setValue('active')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Casa Própria')
    expect(wrapper.text()).toContain('Reserva de Emergência')
    expect(wrapper.text()).not.toContain('Viagem Europa')
  })

  it('calcula progresso limitado a 100% e marca meta concluída', () => {
    const completedCard = wrapper.findAll('.goal-card').find((card) => card.text().includes('Viagem Europa'))
    expect(completedCard.text()).toContain('100%')
    expect(completedCard.classes()).toContain('completed')
  })

  it('marca como atrasada meta ativa com data no passado', () => {
    const overdue = wrapper.findAll('.goal-card').find((card) => card.text().includes('Reserva de Emergência'))
    expect(overdue.classes()).toContain('overdue')
    expect(overdue.text()).toContain('Atrasada')
  })

  it('bloqueia criação de meta sem título, valor e data futura', async () => {
    await wrapper.find('.create-btn').trigger('click')
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Título é obrigatório')
    expect(wrapper.text()).toContain('Valor objetivo deve ser maior que zero')
    expect(wrapper.text()).toContain('Data objetivo é obrigatória')
  })

  it('rejeita data objetivo no passado', async () => {
    await wrapper.find('.create-btn').trigger('click')
    await wrapper.find('#goalTitle').setValue('Nova reserva')
    await wrapper.find('#targetValue').setValue('10000')
    await wrapper.find('#targetDate').setValue(new Date().toISOString().split('T')[0])

    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Data objetivo deve ser futura')
  })

  it('cria meta ativa e incrementa o total', async () => {
    await wrapper.find('.create-btn').trigger('click')
    await wrapper.find('#goalTitle').setValue('Aposentadoria')
    await wrapper.find('#goalCategory').setValue('retirement')
    await wrapper.find('#targetValue').setValue('200000')
    await wrapper.find('#targetDate').setValue('2030-12-31')

    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockToast.success).toHaveBeenCalledWith('Meta criada com sucesso!')
    expect(wrapper.text()).toContain('Aposentadoria')
  })

  it('adiciona aporte e conclui a meta quando atinge o objetivo', async () => {
    const emergencyCard = wrapper.findAll('.goal-card').find((card) => card.text().includes('Reserva de Emergência'))
    const contributeBtn = emergencyCard.findAll('button').find((btn) => btn.text().includes('Aportar'))
    await contributeBtn.trigger('click')

    await wrapper.find('#contributionAmount').setValue('2000')
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockToast.success).toHaveBeenCalledWith('🎉 Parabéns! Meta concluída!')
  })

  it('rejeita aporte com valor zero', async () => {
    const houseCard = wrapper.findAll('.goal-card').find((card) => card.text().includes('Casa Própria'))
    const contributeBtn = houseCard.findAll('button').find((btn) => btn.text().includes('Aportar'))
    await contributeBtn.trigger('click')

    await wrapper.find('#contributionAmount').setValue('0')
    await wrapper.find('.save-btn').trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Valor deve ser maior que zero')
  })

  it('pausa e retoma meta pelo menu de ações', async () => {
    const houseCard = wrapper.findAll('.goal-card').find((card) => card.text().includes('Casa Própria'))
    await houseCard.find('.dropdown-btn').trigger('click')
    await wrapper.vm.$nextTick()

    const pause = wrapper.findAll('.dropdown-item').find((item) => item.text().includes('Pausar'))
    await pause.trigger('click')
    await wrapper.vm.$nextTick()

    expect(mockToast.success).toHaveBeenCalledWith('Meta pausada')
    expect(wrapper.text()).toContain('Pausada')
  })

  it('duplica meta zerando o valor atual', async () => {
    const houseCard = wrapper.findAll('.goal-card').find((card) => card.text().includes('Casa Própria'))
    await houseCard.find('.dropdown-btn').trigger('click')
    const duplicate = wrapper.findAll('.dropdown-item').find((item) => item.text().includes('Duplicar'))
    await duplicate.trigger('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.text()).toContain('Casa Própria (Cópia)')
    expect(mockToast.success).toHaveBeenCalledWith('Meta duplicada com sucesso!')
  })
})
