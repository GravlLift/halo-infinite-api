import { ResolvablePromise } from "./resolvable-promise";

describe("ResolvablePromise", () => {
  test("resolves externally", async () => {
    const p = new ResolvablePromise<number>();
    setTimeout(() => p.resolve(5), 0);
    const v = await p;
    expect(v).toBe(5);
    expect(p.isCompleted).toBe(true);
  });
  test("rejects externally", async () => {
    const p = new ResolvablePromise<number>();
    setTimeout(() => p.reject(new Error("nope")), 0);
    await expect(p).rejects.toThrow("nope");
    expect(p.isCompleted).toBe(true);
  });
  test("only first resolve wins", async () => {
    const p = new ResolvablePromise<number>();
    p.resolve(1);
    // Subsequent resolves are ignored by underlying promise state
    // but we still mark completed already
    p.resolve(2);
    const v = await p;
    expect(v).toBe(1);
  });
});
