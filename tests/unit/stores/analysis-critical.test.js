import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('Analysis Store — alertas críticos', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
  })

  it('só considera críticos os alertas ativos, não lidos e com prioridade critical', () => {
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'critical' },
      { id: 2, isRead: false, status: 'active', priority: 'high' },
      { id: 3, isRead: true, status: 'active', priority: 'critical' },
      { id: 4, isRead: false, status: 'resolved', priority: 'critical' },
      { id: 5, isRead: false, status: 'active', priority: 'critical' }
    ]

    expect(store.activeAlerts.map((alert) => alert.id)).toEqual([1, 2, 5])
    expect(store.criticalAlerts.map((alert) => alert.id)).toEqual([1, 5])
  })

  it('fica vazio quando não há alerta crítico elegível', () => {
    store.alerts = [
      { id: 1, isRead: false, status: 'active', priority: 'medium' }
    ]

    expect(store.criticalAlerts).toEqual([])
  })
})
