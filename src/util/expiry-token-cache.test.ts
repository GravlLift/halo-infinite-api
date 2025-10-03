import { DateTime } from "luxon";
import { ExpiryTokenCache } from "./expiry-token-cache";

interface TestToken {
  token: string;
  expiresAt: DateTime;
  value?: number;
}

describe("ExpiryTokenCache", () => {
  test("returns existing in-flight token when valid", async () => {
    let generateCalls = 0;
    const cache = new ExpiryTokenCache<TestToken, []>(
      async () => {
        generateCalls++;
        return { token: "A", expiresAt: DateTime.now().plus({ minutes: 5 }) };
      },
      async () => null
    );

    const [t1, t2] = await Promise.all([cache.getToken(), cache.getToken()]);
    expect(t1.token).toBe("A");
    expect(t2).toBe(t1);
    expect(generateCalls).toBe(1);
  });

  test("regenerates token when cached token expired", async () => {
    let callIndex = 0;
    const cache = new ExpiryTokenCache<TestToken, []>(
      async () => {
        callIndex++;
        if (callIndex === 1) {
          // Return an already expired token
          return {
            token: `T${callIndex}`,
            expiresAt: DateTime.now().minus({ minutes: 2 }),
          };
        }
        return {
          token: `T${callIndex}`,
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => null
    );

    const expired = await cache.getToken();
    expect(expired.token).toBe("T1");
    // Second call should regenerate
    const refreshed = await cache.getToken();
    expect(refreshed.token).toBe("T2");
  });

  test("uses existing persisted token if still valid", async () => {
    const future = DateTime.now().plus({ minutes: 10 });
    const existing = { token: "persisted", expiresAt: future.toISO() } as any;
    let generateCalls = 0;
    const cache = new ExpiryTokenCache<TestToken, []>(
      async () => {
        generateCalls++;
        return {
          token: "generated",
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => existing
    );

    const t = await cache.getToken();
    expect(t.token).toBe("persisted");
    expect(generateCalls).toBe(0);
  });

  test("falls back to generation if persisted token expired", async () => {
    const past = DateTime.now().minus({ minutes: 1 });
    const existing = { token: "old", expiresAt: past.toISO() } as any;
    let generateCalls = 0;
    const cache = new ExpiryTokenCache<TestToken, []>(
      async () => {
        generateCalls++;
        return { token: "new", expiresAt: DateTime.now().plus({ minutes: 5 }) };
      },
      async () => existing
    );

    const t = await cache.getToken();
    expect(t.token).toBe("new");
    expect(generateCalls).toBe(1);
  });

  test("clears token resets fetch promise", async () => {
    let generateCalls = 0;
    const cache = new ExpiryTokenCache<TestToken, []>(
      async () => {
        generateCalls++;
        return {
          token: `tok${generateCalls}`,
          expiresAt: DateTime.now().plus({ minutes: 5 }),
        };
      },
      async () => null
    );

    const t1 = await cache.getToken();
    expect(t1.token).toBe("tok1");
    cache.clearToken();
    const t2 = await cache.getToken();
    expect(t2.token).toBe("tok2");
    expect(generateCalls).toBe(2);
  });
});
