import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis — coerção de isRead e prioridade de alerta', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
  })

  it('isRead: "false" é truthy e some de activeAlerts', () => {
    store.alerts = [
      { id: 1, isRead: 'false', status: 'active', priority: 'critical', message: 'Stop loss' }
    ]

    expect(store.activeAlerts).toEqual([])
    expect(store.criticalAlerts).toEqual([])
  })

  it('isRead boolean false com priority Critical some de criticalAlerts', () => {
    store.alerts = [
      { id: 2, isRead: false, status: 'active', priority: 'Critical', message: 'Drawdown' }
    ]

    expect(store.activeAlerts.map((alert) => alert.id)).toEqual([2])
    expect(store.criticalAlerts).toEqual([])
  })

  it('isRead false e priority critical aparecem nos dois getters', () => {
    store.alerts = [
      { id: 3, isRead: false, status: 'active', priority: 'critical', message: 'Margem' }
    ]

    expect(store.activeAlerts).toHaveLength(1)
    expect(store.criticalAlerts).toHaveLength(1)
  })
})
