import { describe, it, expect } from 'vitest'
import { calcFlatEMI, calcInterestOnly } from '../pages/admin/Loans'

describe('calcFlatEMI', () => {
  it('computes correct EMI for ₹10,000 at 2% for 10 months', () => {
    const result = calcFlatEMI(10000, 2, 10)
    expect(result.emi).toBe(1200)          // (10000 + 2000) / 10
    expect(result.totalInterest).toBe(2000)
    expect(result.totalRepayment).toBe(12000)
  })

  it('handles zero rate', () => {
    const result = calcFlatEMI(10000, 0, 10)
    expect(result.emi).toBe(1000)
    expect(result.totalInterest).toBe(0)
  })
})

describe('calcInterestOnly', () => {
  it('monthly interest is principal × rate', () => {
    const result = calcInterestOnly(10000, 2, 6)
    expect(result.monthlyInterest).toBe(200)
    expect(result.totalInterest).toBe(1200)
    expect(result.finalPayment).toBe(10200) // principal + last month interest
  })
})
