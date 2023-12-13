export class RequestError extends Error {
  public readonly url: string;
  constructor(
    public readonly request: RequestInfo | URL,
    public readonly response: Response
  ) {
    this.url =
      typeof request === "object" && "url" in request ? request.url : request;
    super(`${this.url} ${response.status} ${response.statusText}`);
  }
}
