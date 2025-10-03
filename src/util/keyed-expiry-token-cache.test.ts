import { DateTime } from "luxon";
import { KeyedExpiryTokenCache } from "./keyed-expiry-token-cache";

interface TestToken {
  key: string;
  token: string;
  expiresAt: DateTime;
}

describe("KeyedExpiryTokenCache", () => {
  test("separate keys do not interfere", async () => {
    let calls: Record<string, number> = {};
    const cache = new KeyedExpiryTokenCache<TestToken, string, []>(
      async (key) => {
        calls[key] = (calls[key] || 0) + 1;
        return {
          key,
          token: `${key}-t${calls[key]}`,
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => null
    );

    const [a1, b1] = await Promise.all([
      cache.getToken("A"),
      cache.getToken("B"),
    ]);
    const a2 = await cache.getToken("A");
    expect(a1.token).toBe("A-t1");
    expect(b1.token).toBe("B-t1");
    expect(a2.token).toBe("A-t1");
    expect(calls["A"]).toBe(1);
    expect(calls["B"]).toBe(1);
  });

  test("expired token per key regenerates only that key", async () => {
    let calls: Record<string, number> = {};
    const cache = new KeyedExpiryTokenCache<TestToken, string, []>(
      async (key) => {
        calls[key] = (calls[key] || 0) + 1;
        return {
          key,
          token: `${key}-t${calls[key]}`,
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => null
    );

    const t1 = await cache.getToken("A");
    // force expired for A
    (cache as any).tokenFetchPromiseMap.set(
      "A",
      Promise.resolve({
        key: "A",
        token: "expired",
        expiresAt: DateTime.now().minus({ minutes: 2 }),
      })
    );
    const t2 = await cache.getToken("A");
    expect(t2.token).toBe("A-t2");
    const b = await cache.getToken("B");
    expect(b.token).toBe("B-t1");
  });

  test("existing persisted token reused if fresh (> -1 minute)", async () => {
    const future = DateTime.now().plus({ minutes: 5 });
    const existing: any = {
      key: "A",
      token: "persisted",
      expiresAt: future.toISO(),
    };
    let calls = 0;
    const cache = new KeyedExpiryTokenCache<TestToken, string, []>(
      async (key) => {
        calls++;
        return {
          key,
          token: "generated",
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async (key) => (key === "A" ? existing : null)
    );

    const t = await cache.getToken("A");
    expect(t.token).toBe("persisted");
    expect(calls).toBe(0);
  });

  test("clearToken removes only one key", async () => {
    let calls: Record<string, number> = {};
    const cache = new KeyedExpiryTokenCache<TestToken, string, []>(
      async (key) => {
        calls[key] = (calls[key] || 0) + 1;
        return {
          key,
          token: `${key}-t${calls[key]}`,
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => null
    );

    await cache.getToken("A");
    await cache.getToken("B");
    cache.clearToken("A");
    const a2 = await cache.getToken("A");
    const b2 = await cache.getToken("B");
    expect(a2.token).toBe("A-t2");
    expect(b2.token).toBe("B-t1");
  });
});
