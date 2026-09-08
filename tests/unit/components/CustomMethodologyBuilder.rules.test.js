import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CustomMethodologyBuilder from '@/components/CustomMethodologyBuilder.vue'

describe('CustomMethodologyBuilder — regras de entrada e saída', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(CustomMethodologyBuilder)
  })

  afterEach(() => {
    wrapper.unmount()
  })

  it('addRule adiciona regra vazia em entrada ou saída sem misturar as listas', () => {
    expect(wrapper.vm.methodology.entryRules).toEqual([])
    expect(wrapper.vm.methodology.exitRules).toEqual([])

    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('exit')
    wrapper.vm.addRule('exit')

    expect(wrapper.vm.methodology.entryRules).toHaveLength(1)
    expect(wrapper.vm.methodology.exitRules).toHaveLength(2)
    expect(wrapper.vm.methodology.entryRules[0]).toMatchObject({
      type: '',
      indicator: '',
      condition: '',
      value: '',
      description: ''
    })
    expect(wrapper.vm.methodology.exitRules[1]).toMatchObject({
      type: '',
      indicator: ''
    })
  })

  it('removeRule remove só o índice pedido da lista correspondente', () => {
    wrapper.vm.addRule('entry')
    wrapper.vm.addRule('entry')
    wrapper.vm.methodology.entryRules[0].indicator = 'rsi'
    wrapper.vm.methodology.entryRules[1].indicator = 'macd'
    wrapper.vm.addRule('exit')
    wrapper.vm.methodology.exitRules[0].indicator = 'close_price'

    wrapper.vm.removeRule('entry', 0)

    expect(wrapper.vm.methodology.entryRules.map((rule) => rule.indicator)).toEqual(['macd'])
    expect(wrapper.vm.methodology.exitRules[0].indicator).toBe('close_price')
  })
})
