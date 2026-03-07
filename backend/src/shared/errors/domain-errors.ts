export class NotFoundError extends Error {
  readonly statusCode = 404;

  constructor(entity: string, id?: string) {
    super(
      id ? `${entity} con id '${id}' no encontrado` : `${entity} no encontrado`,
    );
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  readonly statusCode = 400;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
