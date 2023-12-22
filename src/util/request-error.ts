export class RequestError extends Error {
  public readonly url: string;
  constructor(
    public readonly request: RequestInfo | URL,
    public readonly response: Response
  ) {
    super(
      `${
        typeof request === "object" && "url" in request
          ? request.url
          : typeof request === "string"
          ? request
          : request.href
      } ${response.status} ${response.statusText}`
    );
    this.url =
      typeof request === "object" && "url" in request
        ? request.url
        : typeof request === "string"
        ? request
        : request.href;
  }
}
