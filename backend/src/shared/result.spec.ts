import { Result } from './result';

describe('Result', () => {
  describe('Result.ok', () => {
    it('creates a successful result with the given value', () => {
      const result = Result.ok(42);
      expect(result.isSuccess).toBe(true);
      expect(result.isFailure).toBe(false);
      expect(result.value).toBe(42);
    });

    it('works with string values', () => {
      const result = Result.ok('hello');
      expect(result.value).toBe('hello');
    });

    it('works with object values', () => {
      const obj = { id: '1', name: 'test' };
      const result = Result.ok(obj);
      expect(result.value).toBe(obj);
    });

    it('works with null value', () => {
      const result = Result.ok(null);
      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeNull();
    });

    it('throws when accessing .error on a successful result', () => {
      const result = Result.ok(42);
      expect(() => result.error).toThrow(
        'No puedes acceder al error de un Result exitoso',
      );
    });
  });

  describe('Result.fail', () => {
    it('creates a failed result with the given error', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail(error);
      expect(result.isSuccess).toBe(false);
      expect(result.isFailure).toBe(true);
      expect(result.error).toBe(error);
    });

    it('works with custom error types', () => {
      const customError = { code: 'NOT_FOUND', message: 'Not found' };
      const result = Result.fail(customError);
      expect(result.error).toBe(customError);
    });

    it('throws when accessing .value on a failed result', () => {
      const result = Result.fail(new Error('oops'));
      expect(() => result.value).toThrow(
        'No puedes acceder al valor de un Result fallido',
      );
    });
  });

  describe('map', () => {
    it('transforms the value when result is successful', () => {
      const result = Result.ok(5);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(10);
    });

    it('passes through the error when result is failed', () => {
      const error = new Error('fail');
      const result = Result.fail<Error>(error);
      const mapped = result.map((x) => x * 2);
      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe(error);
    });

    it('chains multiple maps', () => {
      const result = Result.ok(2)
        .map((x) => x + 3)
        .map((x) => x.toString());
      expect(result.value).toBe('5');
    });
  });

  describe('mapAsync', () => {
    it('transforms the value asynchronously when result is successful', async () => {
      const result = Result.ok(5);
      const mapped = await result.mapAsync(async (x) => x * 3);
      expect(mapped.isSuccess).toBe(true);
      expect(mapped.value).toBe(15);
    });

    it('passes through the error when result is failed', async () => {
      const error = new Error('async fail');
      const result = Result.fail<Error>(error);
      const mapped = await result.mapAsync(async (x) => x * 3);
      expect(mapped.isFailure).toBe(true);
      expect(mapped.error).toBe(error);
    });
  });
});
