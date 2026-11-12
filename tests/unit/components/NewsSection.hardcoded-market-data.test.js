import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import NewsSection from '@/components/NewsSection.vue'

const source = readFileSync(
  resolve(__dirname, '../../../src/components/NewsSection.vue'),
  'utf8'
)

describe('NewsSection — notícias de mercado hardcoded sem fonte nem disclaimer', () => {
  it('renderiza cotações estáticas (BTC US$ 120 mil, Selic 10,5%) como se fossem ao vivo', () => {
    const wrapper = mount(NewsSection)

    expect(wrapper.text()).toMatch(/Bitcoin.*US\$ 120 mil/)
    expect(wrapper.text()).toMatch(/Selic permanece em 10,5%/)
    expect(wrapper.text()).toMatch(/Ibovespa fecha em alta/)
    expect(wrapper.findAll('.news-card')).toHaveLength(4)
  })

  it('não traz fonte, data, link nem aviso de que não é recomendação de investimento', () => {
    const wrapper = mount(NewsSection)

    expect(wrapper.text()).not.toMatch(/fonte|disclaimer|não (é|constitui) recomendação/i)
    expect(wrapper.find('time').exists()).toBe(false)
    expect(wrapper.find('a').exists()).toBe(false)
    expect(source).toMatch(/Futuro: trocar news\.value por dados de API/)
    expect(source).not.toMatch(/fetch\(|axios|newsAPI|getNews/)
  })

  it('cards têm cursor pointer mas nenhum @click, router-link ou href — clique não abre a matéria', () => {
    expect(source).toMatch(/cursor:\s*pointer/)
    expect(source).not.toMatch(/@click/)
    expect(source).not.toMatch(/<router-link/)
    expect(source).not.toMatch(/href=/)
  })
})
