import { describe, it, expect } from 'vitest'
import { saveSetting, loadSetting } from '../utils/db'

describe('db.ts - IndexedDB utilities', () => {
  it('saveSetting stores a value and loadSetting retrieves it', async () => {
    await saveSetting('testKey', 'testValue')
    const result = await loadSetting('testKey')
    expect(result).toBe('testValue')
  })

  it('loadSetting returns null for non-existent keys', async () => {
    const result = await loadSetting('nonExistentKey')
    expect(result).toBeNull()
  })
})