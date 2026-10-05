import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAnalysisStore } from '@/stores/analysis'

describe('analysis — status de alerta é case-sensitive', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAnalysisStore()
  })

  it('CRITICAL com status ACTIVE some de activeAlerts e criticalAlerts', () => {
    store.alerts = [
      {
        id: 1,
        message: 'Drawdown acima do limite',
        priority: 'critical',
        isRead: false,
        status: 'ACTIVE'
      }
    ]

    expect(store.activeAlerts).toEqual([])
    expect(store.criticalAlerts).toEqual([])
  })

  it('status Active ou omitted também esconde o alerta não lido', () => {
    store.alerts = [
      {
        id: 2,
        message: 'Sem status',
        priority: 'critical',
        isRead: false
      },
      {
        id: 3,
        message: 'Active capitalizado',
        priority: 'critical',
        isRead: false,
        status: 'Active'
      }
    ]

    expect(store.activeAlerts).toEqual([])
    expect(store.criticalAlerts).toEqual([])
  })

  it('status active minúsculo e isRead false aparece em criticalAlerts', () => {
    store.alerts = [
      {
        id: 4,
        message: 'Queda de 8%',
        priority: 'critical',
        isRead: false,
        status: 'active'
      }
    ]

    expect(store.activeAlerts).toHaveLength(1)
    expect(store.criticalAlerts).toHaveLength(1)
    expect(store.criticalAlerts[0].id).toBe(4)
  })
})
