import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Hero from '@/components/Hero.vue'
import Header from '@/components/Header.vue'

const heroSource = readFileSync(
  resolve(__dirname, '../../../src/components/Hero.vue'),
  'utf8'
)
const homeSource = readFileSync(
  resolve(__dirname, '../../../src/components/Home.vue'),
  'utf8'
)
const mainSource = readFileSync(resolve(__dirname, '../../../src/main.js'), 'utf8')

describe('Hero — marca Kairo´s e patrimônio hardcoded na home pública', () => {
  it('o H1 promove "Kairo´s" enquanto Header e $APP_NAME dizem Agente Investidor', () => {
    const wrapper = mount(Hero)
    const header = mount(Header)

    expect(wrapper.find('h1').text()).toMatch(/Kairo´s/)
    expect(wrapper.text()).not.toMatch(/Agente Investidor/i)
    expect(header.text().toLowerCase()).toMatch(/agente/)
    expect(header.text().toLowerCase()).toMatch(/investidor/)
    expect(mainSource).toMatch(/\$APP_NAME = 'Agente Investidor'/)
    expect(homeSource).toMatch(/<Hero/)
  })

  it('mockup mostra R$ 120.000,00 e 103% do CDI sem fonte, disclaimer nem API', () => {
    const wrapper = mount(Hero)

    expect(wrapper.text()).toMatch(/R\$ 120\.000,00/)
    expect(wrapper.text()).toMatch(/Carteira 103% do CDI/)
    expect(wrapper.text()).not.toMatch(/exemplo|simulação|disclaimer|não (é|constitui) recomendação/i)
    expect(heroSource).not.toMatch(/fetch\(|axios|portfolioStore|getSummary/)
    expect(heroSource).toMatch(/mockup-value/)
  })
})
