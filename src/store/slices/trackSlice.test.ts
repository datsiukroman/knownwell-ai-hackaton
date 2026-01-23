import { beforeEach, describe, expect, it } from 'vitest'
import { store } from '../../store'
import mockApi from '../../api/mockApi'
import { addItemAndPersist } from './trackSlice'

beforeEach(() => {
  mockApi.resetStore()
})

describe('track persistence', () => {
  it('persists added item to mock storage', async () => {
    // seed initial data (loads defaults into the in-memory store)
    await mockApi.loadInitialData()

    const item = {
      id: 'test-1',
      type: 'milestone',
      title: 'Test add',
      details: 'details',
      timestamp: Date.now()
    }

    // dispatch thunk
    await (store.dispatch as any)(addItemAndPersist(item))

    const stored = mockApi.getTrack()
    expect(stored.length).toBeGreaterThan(0)
    expect(stored[0].id).toBe('test-1')
  })
})
