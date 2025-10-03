import { DateTime } from "luxon";
import { coalesceDateTime } from "./date-time";

describe("date-time util", () => {
  test("coalesces DateTime directly", () => {
    const dt = DateTime.now();
    expect(coalesceDateTime(dt)).toBe(dt);
  });
  test("coalesces Date", () => {
    const d = new Date();
    const dt = coalesceDateTime(d);
    expect(dt?.toISO()).toBeDefined();
  });
  test("coalesces ISO string", () => {
    const iso = DateTime.now().toISO();
    const dt = coalesceDateTime(iso);
    expect(dt?.toISO()).toBe(iso);
  });
  test("returns undefined for other", () => {
    expect(coalesceDateTime(123)).toBeUndefined();
  });
});
