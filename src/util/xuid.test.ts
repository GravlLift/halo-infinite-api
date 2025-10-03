import { wrapPlayerId, unwrapPlayerId } from "./xuid";

describe("xuid util", () => {
  test("wraps plain numeric id", () => {
    expect(wrapPlayerId("12345")).toBe("xuid(12345)");
  });
  test("does not double wrap", () => {
    expect(wrapPlayerId("xuid(12345)")).toBe("xuid(12345)");
  });
  test("unwrap extracts numeric id", () => {
    expect(unwrapPlayerId("xuid(678)")).toBe("678");
  });
  test("unwrap returns original if not pattern", () => {
    expect(unwrapPlayerId("abc")).toBe("abc");
  });
});
