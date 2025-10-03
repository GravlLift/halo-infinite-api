import { RequestError } from "./request-error";

describe("RequestError", () => {
  test("formats message with string url", () => {
    const response = new Response(null, { status: 404 });
    const err = new RequestError("https://example.com/test", response);
    expect(err.message).toBe("404 from https://example.com/test");
    expect(err.url).toBe("https://example.com/test");
    expect(err.name).toBe("RequestError");
  });
  test("formats message with Request object", () => {
    const req = new Request("https://site.local/api");
    const response = new Response(null, { status: 500 });
    const err = new RequestError(req, response);
    expect(err.message).toBe("500 from https://site.local/api");
    expect(err.url).toBe("https://site.local/api");
  });
});
