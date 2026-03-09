import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('../../services/api', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

import api from '../../services/api';
import { paymentService } from '../../services/payment.service';

const CARD_DATA = {
  number: '4111 1111 1111 1111',
  holder: 'TEST USER',
  expiryMonth: '12',
  expiryYear: '30',
  cvv: '123',
};

const PAYMENT_PAYLOAD = {
  productId: 'p1',
  customerName: 'Test User',
  customerEmail: 'test@test.com',
  deliveryAddress: 'Calle 1',
  deliveryCity: 'Bogotá',
  deliveryDepartment: 'Cundinamarca',
  cardToken: 'tok_1',
  acceptanceToken: 'acc_1',
  cardLastFour: '1111',
};

describe('paymentService — getAcceptanceToken', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls GET /payments/acceptance-token and returns the token', async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { data: { acceptanceToken: 'acc_token_123' } },
    });

    const result = await paymentService.getAcceptanceToken();

    expect(api.get).toHaveBeenCalledWith('/payments/acceptance-token');
    expect(result).toBe('acc_token_123');
  });
});

describe('paymentService — tokenizeCard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the card token on a successful fetch', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'tok_xyz' } }),
    });

    const token = await paymentService.tokenizeCard(CARD_DATA);

    expect(token).toBe('tok_xyz');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tokens/cards'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('strips spaces from the card number before sending', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'tok_abc' } }),
    });

    await paymentService.tokenizeCard(CARD_DATA);

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.number).toBe('4111111111111111');
  });

  it('throws with joined messages when response is not ok and error.messages is present', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { messages: ['Card invalid', 'Expired'] } }),
    });

    await expect(paymentService.tokenizeCard(CARD_DATA)).rejects.toThrow('Card invalid, Expired');
  });

  it('throws with error.type when messages array is absent', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { type: 'CARD_ERROR' } }),
    });

    await expect(paymentService.tokenizeCard(CARD_DATA)).rejects.toThrow('CARD_ERROR');
  });

  it('throws a default message when error format is unknown', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({}),
    });

    await expect(paymentService.tokenizeCard(CARD_DATA)).rejects.toThrow('Error al procesar la tarjeta');
  });

  it('throws when response is ok but data.id is missing', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: {} }),
    });

    await expect(paymentService.tokenizeCard(CARD_DATA)).rejects.toThrow(
      'No se pudo tokenizar la tarjeta',
    );
  });

  it('throws default message when json() rejects (malformed body)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('Invalid JSON')),
    });

    await expect(paymentService.tokenizeCard(CARD_DATA)).rejects.toThrow('Error al procesar la tarjeta');
  });
});

describe('paymentService — processPayment', () => {
  beforeEach(() => vi.clearAllMocks());

  it('posts to /transactions and returns the transaction data', async () => {
    const txData = {
      transactionId: 'tx_1',
      reference: 'ref_1',
      status: 'PENDING',
      totalInCents: 500000,
      product: { id: 'p1', name: 'Product 1' },
    };

    vi.mocked(api.post).mockResolvedValueOnce({ data: { data: txData } });

    const result = await paymentService.processPayment(PAYMENT_PAYLOAD);

    expect(api.post).toHaveBeenCalledWith('/transactions', PAYMENT_PAYLOAD);
    expect(result).toEqual(txData);
  });
});

describe('paymentService — pollTransactionStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => vi.useRealTimers());

  it('returns APPROVED when the transaction is approved on the first poll', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'APPROVED' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('APPROVED');
  });

  it('returns DECLINED when the transaction is declined', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'DECLINED' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('DECLINED');
  });

  it('returns ERROR when transaction errors out', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'ERROR' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('ERROR');
  });

  it('returns VOIDED status', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'VOIDED' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('VOIDED');
  });

  it('calls onStatusChange callback with the current status', async () => {
    const onStatusChange = vi.fn();
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'APPROVED' } } });

    const promise = paymentService.pollTransactionStatus('tx_1', onStatusChange);
    await vi.runAllTimersAsync();
    await promise;

    expect(onStatusChange).toHaveBeenCalledWith('APPROVED');
  });

  it('returns ERROR after max attempts when status stays PENDING', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: { status: 'PENDING' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('ERROR');
  });

  it('continues polling after a network error and returns the next terminal status', async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValue({ data: { data: { status: 'APPROVED' } } });

    const promise = paymentService.pollTransactionStatus('tx_1');
    await vi.runAllTimersAsync();
    expect(await promise).toBe('APPROVED');
  });
});
