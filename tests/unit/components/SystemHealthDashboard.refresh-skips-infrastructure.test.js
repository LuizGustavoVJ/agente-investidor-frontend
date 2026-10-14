import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import Chart from 'chart.js/auto'
import SystemHealthDashboard from '@/components/SystemHealthDashboard.vue'

vi.mock('chart.js/auto', () => ({
  default: vi.fn().mockImplementation(() => ({
    destroy: vi.fn(),
    update: vi.fn()
  }))
}))

describe('SystemHealthDashboard — refreshData não atualiza infraestrutura', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-14T10:00:00.000Z'))
    Chart.mockClear()
    wrapper = mount(SystemHealthDashboard)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
  })

  it('após o refresh do mount, database/redis/kafka/nginx permanecem nos valores estáticos', async () => {
    const snapshot = {
      database: { ...wrapper.vm.database },
      redis: { ...wrapper.vm.redis },
      kafka: { ...wrapper.vm.kafka },
      nginx: { ...wrapper.vm.nginx }
    }

    expect(snapshot.database.activeConnections).toBe(45)
    expect(snapshot.redis.hitRate).toBe(97.8)
    expect(snapshot.kafka.totalLag).toBe(125)
    expect(snapshot.nginx.sslExpiry).toBe(87)

    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()

    expect(wrapper.vm.database).toEqual(snapshot.database)
    expect(wrapper.vm.redis).toEqual(snapshot.redis)
    expect(wrapper.vm.kafka).toEqual(snapshot.kafka)
    expect(wrapper.vm.nginx).toEqual(snapshot.nginx)
    expect(wrapper.vm.overallStatus.lastUpdate).toBeInstanceOf(Date)
  })

  it('um refresh explícito também não toca infraestrutura', async () => {
    await vi.advanceTimersByTimeAsync(2100)
    await flushPromises()

    wrapper.vm.database.activeConnections = 12
    wrapper.vm.redis.hitRate = 10
    wrapper.vm.kafka.totalLag = 9999
    wrapper.vm.nginx.upstreamHealth = 0

    const pending = wrapper.vm.refreshData()
    await vi.advanceTimersByTimeAsync(2000)
    await pending
    await flushPromises()

    expect(wrapper.vm.database.activeConnections).toBe(12)
    expect(wrapper.vm.redis.hitRate).toBe(10)
    expect(wrapper.vm.kafka.totalLag).toBe(9999)
    expect(wrapper.vm.nginx.upstreamHealth).toBe(0)
  })
})
