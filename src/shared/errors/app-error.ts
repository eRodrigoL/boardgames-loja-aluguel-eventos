export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly details: unknown[] = [],
  ) {
    super(message);
  }
}

export const notFound = (resource: string) =>
  new AppError('RESOURCE_NOT_FOUND', 404, `${resource} was not found.`);
