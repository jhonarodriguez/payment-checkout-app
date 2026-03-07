export class Result<T, E = Error> {
  public readonly isSuccess: boolean;
  private readonly _value?: T;
  private readonly _error?: E;

  private constructor(isSuccess: boolean, value?: T, error?: E) {
    this.isSuccess = isSuccess;
    this._value = value;
    this._error = error;
  }

  get isFailure(): boolean {
    return !this.isSuccess;
  }

  get value(): T {
    if (!this.isSuccess) {
      throw new Error(
        'No puedes acceder al valor de un Result fallido. ' +
          'Verifica isSuccess antes de acceder a .value',
      );
    }
    return this._value as T;
  }

  get error(): E {
    if (this.isSuccess) {
      throw new Error(
        'No puedes acceder al error de un Result exitoso. ' +
          'Verifica isFailure antes de acceder a .error',
      );
    }
    return this._error as E;
  }

  static ok<T>(value: T): Result<T> {
    return new Result<T>(true, value);
  }

  static fail<E>(error: E): Result<any, E> {
    return new Result<any, E>(false, undefined, error);
  }

  map<U>(fn: (value: T) => U): Result<U, E> {
    if (this.isFailure) {
      return Result.fail<E>(this.error);
    }
    return Result.ok<U>(fn(this.value)) as Result<U, E>;
  }

  async mapAsync<U>(fn: (value: T) => Promise<U>): Promise<Result<U, E>> {
    if (this.isFailure) {
      return Result.fail(this.error);
    }
    const newValue = await fn(this.value);
    return Result.ok(newValue) as Result<U, E>;
  }
}
