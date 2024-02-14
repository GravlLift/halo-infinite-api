export class RequestError extends Error {
  public readonly url: string;
  constructor(
    public readonly request: RequestInfo | URL,
    public readonly response: Response
  ) {
    super(
      `${response.status} from ${
        typeof request === "object" && "url" in request
          ? request.url
          : typeof request === "string"
          ? request
          : request.href
      }`
    );
    this.url =
      typeof request === "object" && "url" in request
        ? request.url
        : typeof request === "string"
        ? request
        : request.href;
    this.name = "RequestError";
  }
}
