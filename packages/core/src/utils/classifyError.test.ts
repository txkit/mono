import { describe, it, expect } from 'vitest'

import { classifyError } from './index'


describe('classifyError', () => {
  describe('USER_REJECTED', () => {
    it('detects UserRejectedRequestError by name', () => {
      const err = new Error('action rejected')
      err.name = 'UserRejectedRequestError'
      expect(classifyError(err)).toBe('USER_REJECTED')
    })

    it('detects "user rejected" in message', () => {
      expect(classifyError(new Error('User rejected the request'))).toBe('USER_REJECTED')
    })

    it('detects "user denied" in message', () => {
      expect(classifyError(new Error('User denied transaction signature'))).toBe('USER_REJECTED')
    })
  })

  describe('INSUFFICIENT_FUNDS', () => {
    it('detects "insufficient funds" in message', () => {
      expect(classifyError(new Error('insufficient funds for gas * price + value'))).toBe('INSUFFICIENT_FUNDS')
    })

    it('detects "exceeds the balance" in message', () => {
      expect(classifyError(new Error('sender exceeds the balance'))).toBe('INSUFFICIENT_FUNDS')
    })
  })

  describe('EXECUTION_REVERTED', () => {
    it('detects "reverted" in message', () => {
      expect(classifyError(new Error('execution reverted: ERC20: transfer amount exceeds balance'))).toBe('EXECUTION_REVERTED')
    })

    it('detects "execution reverted" in message', () => {
      expect(classifyError(new Error('Execution reverted'))).toBe('EXECUTION_REVERTED')
    })
  })

  describe('GAS_ESTIMATION_FAILED', () => {
    it('detects gas estimation failure', () => {
      expect(classifyError(new Error('gas estimate failed'))).toBe('GAS_ESTIMATION_FAILED')
    })

    it('detects gas limit error', () => {
      expect(classifyError(new Error('exceeds gas limit'))).toBe('GAS_ESTIMATION_FAILED')
    })
  })

  describe('TIMEOUT', () => {
    it('detects timeout', () => {
      expect(classifyError(new Error('request timeout'))).toBe('TIMEOUT')
    })

    it('detects timed out', () => {
      expect(classifyError(new Error('Transaction timed out'))).toBe('TIMEOUT')
    })
  })

  describe('CHAIN_MISMATCH', () => {
    it('detects ChainMismatchError by name', () => {
      const err = new Error('wrong chain')
      err.name = 'ChainMismatchError'
      expect(classifyError(err)).toBe('CHAIN_MISMATCH')
    })

    it('detects "chain mismatch" in message', () => {
      expect(classifyError(new Error('chain mismatch detected'))).toBe('CHAIN_MISMATCH')
    })

    it('detects "wrong network" in message', () => {
      expect(classifyError(new Error('wrong network'))).toBe('CHAIN_MISMATCH')
    })
  })

  describe('NETWORK_ERROR', () => {
    it('detects network error', () => {
      expect(classifyError(new Error('network error'))).toBe('NETWORK_ERROR')
    })

    it('detects disconnected', () => {
      expect(classifyError(new Error('WebSocket disconnected'))).toBe('NETWORK_ERROR')
    })

    it('detects fetch failed', () => {
      expect(classifyError(new Error('fetch failed'))).toBe('NETWORK_ERROR')
    })
  })

  describe('UNKNOWN', () => {
    it('returns UNKNOWN for generic errors', () => {
      expect(classifyError(new Error('something happened'))).toBe('UNKNOWN')
    })

    it('returns UNKNOWN for null', () => {
      expect(classifyError(null)).toBe('UNKNOWN')
    })

    it('returns UNKNOWN for undefined', () => {
      expect(classifyError(undefined)).toBe('UNKNOWN')
    })

    it('returns UNKNOWN for non-object', () => {
      expect(classifyError('string error')).toBe('UNKNOWN')
    })

    it('returns UNKNOWN for empty error', () => {
      expect(classifyError(new Error(''))).toBe('UNKNOWN')
    })
  })

  describe('shortMessage priority', () => {
    it('uses shortMessage over message when available', () => {
      const err = { name: 'Error', message: 'some long message', shortMessage: 'insufficient funds' }
      expect(classifyError(err)).toBe('INSUFFICIENT_FUNDS')
    })
  })
})
