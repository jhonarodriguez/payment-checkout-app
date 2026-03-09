import { describe, it, expect } from 'vitest';
import transactionReducer, {
  setTransaction,
  setLoading,
  setError,
  resetTransaction,
} from '../../store/slices/transactionSlice';
import type { TransactionStatus } from '../../types';

const INITIAL = {
  id: null,
  reference: null,
  status: null,
  totalInCents: null,
  loading: false,
  error: null,
};

describe('transactionSlice', () => {
  it('has correct initial state', () => {
    const state = transactionReducer(undefined, { type: '@@INIT' });
    expect(state).toEqual(INITIAL);
  });

  describe('setTransaction', () => {
    it('stores all transaction fields and resets loading/error', () => {
      const payload = {
        id: 'tx_1',
        reference: 'ref_1',
        status: 'APPROVED' as TransactionStatus,
        totalInCents: 500000,
      };
      const state = transactionReducer(
        { ...INITIAL, loading: true, error: 'old error' },
        setTransaction(payload),
      );
      expect(state.id).toBe('tx_1');
      expect(state.reference).toBe('ref_1');
      expect(state.status).toBe('APPROVED');
      expect(state.totalInCents).toBe(500000);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('stores DECLINED status', () => {
      const state = transactionReducer(
        INITIAL,
        setTransaction({ id: 'tx_2', reference: 'r', status: 'DECLINED', totalInCents: 0 }),
      );
      expect(state.status).toBe('DECLINED');
    });
  });

  describe('setLoading', () => {
    it('sets loading to true', () => {
      const state = transactionReducer(INITIAL, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('sets loading to false', () => {
      const state = transactionReducer({ ...INITIAL, loading: true }, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setError', () => {
    it('stores the error message and stops loading', () => {
      const state = transactionReducer({ ...INITIAL, loading: true }, setError('Something failed'));
      expect(state.error).toBe('Something failed');
      expect(state.loading).toBe(false);
    });
  });

  describe('resetTransaction', () => {
    it('resets all fields to initial state', () => {
      const populated = {
        id: 'tx_1',
        reference: 'ref_1',
        status: 'APPROVED' as TransactionStatus,
        totalInCents: 500000,
        loading: false,
        error: null,
      };
      const state = transactionReducer(populated, resetTransaction());
      expect(state).toEqual(INITIAL);
    });
  });
});
