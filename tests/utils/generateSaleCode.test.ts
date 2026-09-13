import { describe, it, expect } from 'vitest'
import { generateSaleCode } from '../../server/utils/generateSaleCode'

describe('generateSaleCode', () => {
  it('should generate a code with prefix SL-', () => {
    const code = generateSaleCode()
    expect(code).toMatch(/^SL-/)
  })

  it('should include the current date in YYYYMMDD format', () => {
    const code = generateSaleCode()
    const date = new Date()
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
    expect(code).toContain(`-${dateStr}-`)
  })

  it('should have a random 4-character suffix', () => {
    const code = generateSaleCode()
    const parts = code.split('-')
    expect(parts.length).toBe(3)
    expect(parts[2].length).toBe(4)
  })
})
