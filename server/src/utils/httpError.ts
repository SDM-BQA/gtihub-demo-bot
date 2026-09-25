// Throw this from anywhere in a request; errorHandler turns it into a JSON response with the right status.
export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
